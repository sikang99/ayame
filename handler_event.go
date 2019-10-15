package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

// CAUTION: don't use small case in fields of structure in json handling
type EventData struct {
	UserId  string `json:"user_id"`
	Status  string `json:"staus,omitempty"`
	OccurAt string `json:"occur_at,omitempty"`
}

type EventMessage struct {
	Event string
	Id    string
	Retry string
	Data  EventData
}

func eventHandler(hub *Hub, w http.ResponseWriter, r *http.Request) {
	log.Printf(r.URL.Path)
	op := strings.TrimPrefix(r.URL.Path, "/event/")

	switch op {
	case "send":
		recvEventData(hub, w, r)
	case "recv":
		sendEventStream(hub, w, r)
	default:
		fmt.Fprintf(w, "[send|recv] should be used")
		log.Printf("%s not supported", op)
	}
	log.Printf("event closed for %s", op)
}

func recvEventData(hub *Hub, w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "send not implemented")
	log.Printf("send not implemented")
}

func sendEventStream(hub *Hub, w http.ResponseWriter, r *http.Request) {
	// check if SSE is supported
	f, ok := w.(http.Flusher)
	if !ok {
		log.Printf("SSE Streaming not suported")
		return
	}

	// Headers setting for SSE streaming
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*") // cojam.tv after test

	emsg := EventMessage{Event: "notify", Id: "ayame", Retry: "1000"}

	switch emsg.Event {
	case "notify":
		emsg.Data.UserId = "sikang99@gmail.com"
		emsg.Data.Status = "idle"
		// fmt.Println(emsg)
	default:
		log.Printf("%s is unknown event", emsg.Event)
	}

	for i := 0; i < 100; i++ {
		str := genStringEventMessage(emsg)
		fmt.Fprintf(w, str)
		f.Flush()
		time.Sleep(1 * time.Second)
		if i > 2 {
			return
		}
	}
	log.Printf("event streaming closed")
}

func genStringEventMessage(emsg EventMessage) (str string) {
	emsg.Data.OccurAt = time.Now().Format("2006/01/02 15:04:05")
	// jdata, err := json.MarshalIndent(edata, "", " ")
	jdata, err := json.Marshal(emsg.Data)
	if err != nil {
		log.Printf("json.Marshal error: ", err)
		return
	}
	str = fmt.Sprintf("event:%s\nretry:%s\nid:%s\ndata:%s\n\n", emsg.Event, emsg.Retry, emsg.Id, string(jdata))
	return
}
