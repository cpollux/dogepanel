package main

import (
	"fmt"
	"github.com/julienschmidt/httprouter"
	"github.com/spf13/viper"
	"net/http"
	"text/template"
	"log"
	"encoding/json"
)

var loginT = template.Must(template.New("login").ParseFiles("templates/base.html", "templates/login.html"))
var panelT = template.Must(template.New("panel").ParseFiles("templates/base.html", "templates/panel.html"))

type Page struct {
	Title string
	Font string
}

func ViewLoginHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	p := Page{"DogePanel | Login", viper.GetString("uiFont")}
	loginT.ExecuteTemplate(w, "base", p)
}

func SubmitLoginHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	fmt.Fprint(w, "Welcome! 3\n")
}

func ViewPanelHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	p := Page{"DogePanel", viper.GetString("uiFont")}
	panelT.ExecuteTemplate(w, "base", p)
}

func ViewDataHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	
	// get Data
	data, err := getData()

	if err == nil {
		j, err := json.Marshal(data)
		
		if err == nil {
			w.Write(j)
		} else {
			log.Printf("\n\n%s\n\n", err)
			w.Write([]byte("{\"error\": \"Could not retrieve new data. Please check the log file.\"}"))
		}
	} else {
		log.Printf("\n\n%s\n\n", err)
		w.Write([]byte("{\"error\": \"Could not retrieve new data. Please check the log file.\"}"))
	}
}
