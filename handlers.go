package main

import (
	"fmt"
	"github.com/julienschmidt/httprouter"
	"net/http"
	"text/template"
)

var loginT = template.Must(template.New("login").ParseFiles("templates/base.html", "templates/login.html"))
var panelT = template.Must(template.New("panel").ParseFiles("templates/base.html", "templates/panel.html"))

type Page struct {
	Title string
}

func ViewLoginHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	p := Page{"DogePanel | Login"}
	loginT.ExecuteTemplate(w, "base", p)
}

func SubmitLoginHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	fmt.Fprint(w, "Welcome! 3\n")
}

func ViewPanelHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	p := Page{"DogePanel"}
	panelT.ExecuteTemplate(w, "base", p)
}

func ViewDataHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	fmt.Fprint(w, "Welcome! 4\n")
}
