/**
 * AlphaCore The Lab — Co-op Multiplayer Networking Layer (1-4 Operators)
 * Provides room hosting, code discovery, role synchronization, and action broadcasts.
 * Implements a hybrid network stack (WebRTC PeerJS with graceful BroadcastChannel + LocalStorage fallback).
 */

export class LabNetworkManager {
  constructor({ onPlayersUpdate, onStateUpdate, onActionReceived, onLogMessage }) {
    this.onPlayersUpdate = onPlayersUpdate || (() => {});
    this.onStateUpdate = onStateUpdate || (() => {});
    this.onActionReceived = onActionReceived || (() => {});
    this.onLogMessage = onLogMessage || (() => {});

    this.isHost = false;
    this.roomCode = null;
    this.localPlayerId = 'op_' + Math.random().toString(36).substring(2, 7);
    this.localPlayerName = sessionStorage.getItem('current_profile') || 'Operator-' + this.localPlayerId.slice(-3);
    this.localRole = 'SYNTHESIZER';
    
    this.players = [];
    this.channel = null;
    this.peer = null;
    this.connections = [];
  }

  generateRoomCode() {
    return 'LAB-' + Math.floor(1000 + Math.random() * 9000);
  }

  // Initialize room as Host
  hostRoom(roomCode = null) {
    this.isHost = true;
    this.roomCode = roomCode || this.generateRoomCode();
    this.players = [
      {
        id: this.localPlayerId,
        name: this.localPlayerName,
        role: this.localRole,
        isHost: true,
        ping: '12ms',
        status: 'READY'
      }
    ];

    this._initChannel(this.roomCode);
    this._tryInitPeer(this.roomCode, true);
    this.onPlayersUpdate(this.players);
    this.onLogMessage(`ROOM CREATED: ${this.roomCode} (HOST: ${this.localPlayerName})`, '#00ff66');
    return this.roomCode;
  }

  // Join existing room
  joinRoom(roomCode, chosenName = null) {
    this.isHost = false;
    this.roomCode = roomCode.trim().toUpperCase();
    if (chosenName) this.localPlayerName = chosenName;

    this.players = [
      {
        id: this.localPlayerId,
        name: this.localPlayerName,
        role: this.localRole,
        isHost: false,
        ping: '24ms',
        status: 'CONNECTING'
      }
    ];

    this._initChannel(this.roomCode);
    this._tryInitPeer(this.roomCode, false);
    
    // Broadcast join event
    this.broadcast({
      type: 'PLAYER_JOIN_REQUEST',
      player: {
        id: this.localPlayerId,
        name: this.localPlayerName,
        role: this.localRole,
        isHost: false
      }
    });

    this.onPlayersUpdate(this.players);
    this.onLogMessage(`CONNECTING TO ROOM: ${this.roomCode}...`, 'var(--accent, #06b6d4)');
  }

  setRole(newRole) {
    this.localRole = newRole;
    const me = this.players.find(p => p.id === this.localPlayerId);
    if (me) me.role = newRole;
    this.broadcast({
      type: 'ROLE_CHANGED',
      playerId: this.localPlayerId,
      role: newRole
    });
    this.onPlayersUpdate(this.players);
  }

  // Send chemical/reactor gameplay action
  sendGameAction(action) {
    const payload = {
      type: 'GAME_ACTION',
      senderId: this.localPlayerId,
      senderName: this.localPlayerName,
      action: action,
      timestamp: Date.now()
    };
    this.broadcast(payload);
    // Execute locally
    this.onActionReceived(payload);
  }

  // Broadcast game state (Host authoritative)
  broadcastGameState(state) {
    if (!this.isHost) return;
    this.broadcast({
      type: 'STATE_SYNC',
      state: state,
      timestamp: Date.now()
    });
  }

  broadcast(msg) {
    // 1. BroadcastChannel (works between tabs and local windows)
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (err) {
        console.warn('[NETWORK] Channel send error:', err);
      }
    }

    // 2. PeerJS WebRTC data channels
    if (this.connections && this.connections.length > 0) {
      this.connections.forEach(conn => {
        if (conn && conn.open) {
          try {
            conn.send(msg);
          } catch (err) {
            console.warn('[NETWORK] Peer send error:', err);
          }
        }
      });
    }
  }

  _initChannel(code) {
    if (this.channel) {
      try { this.channel.close(); } catch (_) {}
    }

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('alphacore_lab_' + code);
      this.channel.onmessage = (event) => {
        this._handleIncomingMessage(event.data);
      };
    }
  }

  _tryInitPeer(roomCode, asHost) {
    // Load PeerJS dynamically if available
    if (!window.Peer) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
      script.async = true;
      script.onload = () => this._setupPeer(roomCode, asHost);
      script.onerror = () => {
        console.log('[NETWORK] PeerJS load deferred, using BroadcastChannel matrix.');
      };
      document.head.appendChild(script);
    } else {
      this._setupPeer(roomCode, asHost);
    }
  }

  _setupPeer(roomCode, asHost) {
    try {
      const peerId = asHost ? ('aclab_' + roomCode.replace('-', '_')).toLowerCase() : undefined;
      this.peer = new window.Peer(peerId, {
        debug: 0
      });

      this.peer.on('open', (id) => {
        console.log('[NETWORK] Peer connected, ID:', id);
        if (!asHost) {
          // Connect to host
          const hostPeerId = ('aclab_' + roomCode.replace('-', '_')).toLowerCase();
          const conn = this.peer.connect(hostPeerId);
          this._registerPeerConnection(conn);
        }
      });

      this.peer.on('connection', (conn) => {
        this._registerPeerConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('[NETWORK] Peer warning:', err.type);
      });
    } catch (e) {
      console.warn('[NETWORK] Peer init error:', e);
    }
  }

  _registerPeerConnection(conn) {
    conn.on('open', () => {
      this.connections.push(conn);
      console.log('[NETWORK] P2P Channel Established with', conn.peer);
      if (this.isHost) {
        // Send full player list to new peer
        conn.send({
          type: 'SYNC_PLAYERS',
          players: this.players
        });
      }
    });

    conn.on('data', (data) => {
      this._handleIncomingMessage(data);
    });

    conn.on('close', () => {
      this.connections = this.connections.filter(c => c !== conn);
    });
  }

  _handleIncomingMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    switch (msg.type) {
      case 'PLAYER_JOIN_REQUEST': {
        if (this.isHost) {
          if (!this.players.some(p => p.id === msg.player.id)) {
            // Assign vacant role if available
            const usedRoles = this.players.map(p => p.role);
            const allRoles = ['SYNTHESIZER', 'THERMAL', 'PRESSURE', 'HAZARD'];
            const freeRole = allRoles.find(r => !usedRoles.includes(r)) || 'SYNTHESIZER';
            msg.player.role = freeRole;
            msg.player.ping = Math.floor(18 + Math.random() * 20) + 'ms';
            msg.player.status = 'READY';

            this.players.push(msg.player);
            this.broadcast({
              type: 'SYNC_PLAYERS',
              players: this.players
            });
            this.onPlayersUpdate(this.players);
            this.onLogMessage(`OPERATOR JOINED: ${msg.player.name} [ROLE: ${msg.player.role}]`, '#00ff66');
          }
        }
        break;
      }

      case 'SYNC_PLAYERS': {
        if (Array.isArray(msg.players)) {
          this.players = msg.players;
          const me = this.players.find(p => p.id === this.localPlayerId);
          if (me) {
            this.localRole = me.role;
          }
          this.onPlayersUpdate(this.players);
        }
        break;
      }

      case 'ROLE_CHANGED': {
        const target = this.players.find(p => p.id === msg.playerId);
        if (target) {
          target.role = msg.role;
          this.onPlayersUpdate(this.players);
          this.onLogMessage(`ROLE REASSIGNMENT: ${target.name} -> ${msg.role}`, '#a855f7');
        }
        break;
      }

      case 'GAME_ACTION': {
        if (msg.senderId !== this.localPlayerId) {
          this.onActionReceived(msg);
        }
        break;
      }

      case 'STATE_SYNC': {
        if (!this.isHost) {
          this.onStateUpdate(msg.state);
        }
        break;
      }
    }
  }

  disconnect() {
    if (this.channel) {
      try { this.channel.close(); } catch (_) {}
      this.channel = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (_) {}
      this.peer = null;
    }
    this.connections = [];
    this.players = [];
    this.roomCode = null;
  }
}
