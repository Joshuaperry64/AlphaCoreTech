package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

var dbPath = "data.json"
var dbMutex sync.Mutex

type Pin struct {
	Pin       string   `json:"pin,omitempty"`
	Type      string   `json:"type"`
	Label     string   `json:"label"`
	Roles     []string `json:"roles"`
	CreatedAt int64    `json:"createdAt"`
	Used      bool     `json:"used,omitempty"`
	ExpiresAt int64    `json:"expiresAt,omitempty"`
}

type Settings struct {
	Txt2ImgUrl      string  `json:"txt2imgUrl"`
	Img2ImgUrl      string  `json:"img2imgUrl"`
	NegativePrompt  string  `json:"negativePrompt"`
	StepsFastTxt    int     `json:"stepsFastTxt"`
	StepsFocusedTxt int     `json:"stepsFocusedTxt"`
	StepsNormalTxt  int     `json:"stepsNormalTxt"`
	StepsFastImg    int     `json:"stepsFastImg"`
	StepsFocusedImg int     `json:"stepsFocusedImg"`
	StepsNormalImg  int     `json:"stepsNormalImg"`
	GuidanceImg     float64 `json:"guidanceImg"`
}

type Database struct {
	Pins     []Pin                  `json:"pins"`
	Logs     []interface{}          `json:"logs"`
	Settings Settings               `json:"settings"`
}

func getDefaultDB() Database {
	return Database{
		Pins: []Pin{
			{Pin: "672167566", Type: "permanent", Label: "Architect", Roles: []string{"admin", "vault", "aimodals", "generate", "lora", "diagnostics"}, CreatedAt: time.Now().UnixMilli()},
			{Pin: "6969", Type: "permanent", Label: "DoeBoy", Roles: []string{"admin", "vault", "aimodals", "generate", "lora", "diagnostics"}, CreatedAt: time.Now().UnixMilli()},
		},
		Logs: []interface{}{},
		Settings: Settings{
			Txt2ImgUrl:      "https://josh64perry--alphacore-aio-backend-txt2img-web-txt2img.modal.run",
			Img2ImgUrl:      "https://josh64perry--alphacore-aio-backend-img2img-web-img2img.modal.run",
			NegativePrompt:  "worst quality, low quality, normal quality, lowres, monochrome, grayscale, watermark, signature, text, bad anatomy, bad hands, missing fingers, extra digit, deformed, ugly, mutated, distorted, pixelated, jpeg artifacts",
			StepsFastTxt:    10,
			StepsFocusedTxt: 50,
			StepsNormalTxt:  20,
			StepsFastImg:    8,
			StepsFocusedImg: 30,
			StepsNormalImg:  17,
			GuidanceImg:     4.0,
		},
	}
}

func readDB() Database {
	dbMutex.Lock()
	defer dbMutex.Unlock()

	data, err := os.ReadFile(dbPath)
	if err != nil {
		db := getDefaultDB()
		writeDBInternal(db)
		return db
	}

	var db Database
	if err := json.Unmarshal(data, &db); err != nil {
		log.Println("Error parsing DB, returning default:", err)
		return getDefaultDB()
	}

	if len(db.Pins) == 0 {
		db.Pins = getDefaultDB().Pins
	}
	if db.Logs == nil {
		db.Logs = []interface{}{}
	}
	return db
}

func writeDB(db Database) {
	dbMutex.Lock()
	defer dbMutex.Unlock()
	writeDBInternal(db)
}

func writeDBInternal(db Database) {
	data, _ := json.MarshalIndent(db, "", "  ")
	os.WriteFile(dbPath, data, 0644)
}

func authenticate(r *http.Request) bool {
	userPin := r.Header.Get("X-User-Pin")
	if userPin == "" {
		userPin = r.Header.Get("x-user-pin")
	}
	db := readDB()
	for _, p := range db.Pins {
		if p.Pin == userPin {
			return true
		}
	}
	return false
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-User-Pin")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func handlePins(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		db := readDB()
		if authenticate(r) {
			json.NewEncoder(w).Encode(db.Pins)
		} else {
			safePins := []Pin{}
			for _, p := range db.Pins {
				p.Pin = ""
				safePins = append(safePins, p)
			}
			json.NewEncoder(w).Encode(safePins)
		}
	} else if r.Method == "POST" {
		if !authenticate(r) {
			http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
			return
		}
		var newPins []Pin
		if err := json.NewDecoder(r.Body).Decode(&newPins); err != nil {
			http.Error(w, `{"error":"Invalid JSON"}`, http.StatusBadRequest)
			return
		}
		db := readDB()
		db.Pins = newPins
		writeDB(db)
		json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func handleLogs(w http.ResponseWriter, r *http.Request) {
	if !authenticate(r) {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}
	if r.Method == "GET" {
		json.NewEncoder(w).Encode(readDB().Logs)
	} else if r.Method == "POST" {
		var newLogs []interface{}
		if err := json.NewDecoder(r.Body).Decode(&newLogs); err != nil {
			http.Error(w, `{"error":"Invalid JSON"}`, http.StatusBadRequest)
			return
		}
		db := readDB()
		db.Logs = newLogs
		writeDB(db)
		json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func handleSettings(w http.ResponseWriter, r *http.Request) {
	if !authenticate(r) {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}
	if r.Method == "GET" {
		json.NewEncoder(w).Encode(readDB().Settings)
	} else if r.Method == "POST" {
		var newSettings Settings
		if err := json.NewDecoder(r.Body).Decode(&newSettings); err != nil {
			http.Error(w, `{"error":"Invalid JSON"}`, http.StatusBadRequest)
			return
		}
		db := readDB()
		db.Settings = newSettings
		writeDB(db)
		json.NewEncoder(w).Encode(map[string]bool{"success": true})
	}
}

func handleAuth(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var reqBody struct {
		Pin          string `json:"pin"`
		RequiredRole string `json:"requiredRole"`
	}
	json.NewDecoder(r.Body).Decode(&reqBody)

	db := readDB()
	var found *Pin
	for i, p := range db.Pins {
		if p.Pin == reqBody.Pin {
			found = &db.Pins[i]
			break
		}
	}

	if found == nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"valid": false, "reason": "ACCESS DENIED"})
		return
	}

	if reqBody.RequiredRole != "" {
		hasRole := false
		for _, r := range found.Roles {
			if r == reqBody.RequiredRole {
				hasRole = true
				break
			}
		}
		if !hasRole {
			json.NewEncoder(w).Encode(map[string]interface{}{"valid": false, "reason": "INSUFFICIENT CLEARANCE: REQUIRES [" + strings.ToUpper(reqBody.RequiredRole) + "]"})
			return
		}
	}

	if found.Type == "one-time" {
		if found.Used {
			json.NewEncoder(w).Encode(map[string]interface{}{"valid": false, "reason": "ONE-TIME PIN EXPIRED"})
			return
		}
		found.Used = true
		// Remove it from DB (matching JS behavior)
		var newPins []Pin
		for _, p := range db.Pins {
			if p.Pin != found.Pin {
				newPins = append(newPins, p)
			}
		}
		db.Pins = newPins
		writeDB(db)
		json.NewEncoder(w).Encode(map[string]interface{}{"valid": true, "pinObj": found, "isOtp": true})
		return
	}

	if found.Type == "temporary" {
		if time.Now().UnixMilli() > found.ExpiresAt {
			json.NewEncoder(w).Encode(map[string]interface{}{"valid": false, "reason": "TEMPORARY PIN EXPIRED"})
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"valid": true, "pinObj": found})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{"valid": true, "pinObj": found})
}

func handleRunpod(w http.ResponseWriter, r *http.Request) {
	// Vestigial code handler
	json.NewEncoder(w).Encode(map[string]string{"error": "RunPod functionality disabled in Go backend."})
}

func handleChat(w http.ResponseWriter, r *http.Request) {
	// Vestigial code handler
	json.NewEncoder(w).Encode(map[string]string{"reply": "this feature is still in development."})
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/pins", enableCORS(handlePins))
	mux.HandleFunc("/api/logs", enableCORS(handleLogs))
	mux.HandleFunc("/api/settings", enableCORS(handleSettings))
	mux.HandleFunc("/api/auth", enableCORS(handleAuth))
	mux.HandleFunc("/api/runpod", enableCORS(handleRunpod))
	mux.HandleFunc("/api/chat", enableCORS(handleChat))

	// Serve Static Files
	fs := http.FileServer(http.Dir("dist"))
	mux.Handle("/", fs)

	port := "3000"
	log.Println("[SYS] AlphaCore Go Database Server running on port " + port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}
