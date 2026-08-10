@echo off
echo [SYS] Initiating AlphaCore Deployment Sequence to Edge Router (192.168.2.1)...

echo [SYS] 1/4 Building Frontend...
cd C:\Users\josh6\Workspace\AlphaCoreTech
call npm run build

echo [SYS] 2/4 Cross-Compiling Go Backend (MIPS)...
set GOOS=linux
set GOARCH=mipsle
set GOMIPS=softfloat
go build -o server_mipsle main.go

echo [SYS] 3/4 Pushing Payload to Router...
scp server_mipsle root@192.168.2.1:/root/
scp -r dist root@192.168.2.1:/root/
scp -r C:\Users\josh6\.cloudflared root@192.168.2.1:/etc/cloudflared

echo [SYS] 4/4 Igniting Remote Services...
:: The SSH command kills old instances, sets permissions, and starts both services in the background using busybox.
ssh root@192.168.2.1 "killall server_mipsle 2>/dev/null; killall cloudflared 2>/dev/null; cd /root/; chmod +x server_mipsle; ./server_mipsle > /root/server.log 2>&1 & cloudflared tunnel --config /etc/cloudflared/config.yml run alphacore > /root/tunnel.log 2>&1 &"

echo [SYS] Deployment Complete. Neural Bridge is active on alpha-core.tech.
pause
