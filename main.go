package main

import (
	"github.com/julienschmidt/httprouter"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func main() {

	ex, err := os.Executable() // get directory the binary is placed in
	if err != nil {
		panic(err)
	}
	dirname := filepath.Dir(ex)

	router := httprouter.New()
	router.GET("/", ViewPanelHandler)
	router.GET("/login", ViewLoginHandler)
	router.POST("/login", SubmitLoginHandler)
	router.GET("/data", ViewDataHandler)
	router.ServeFiles("/static/*filepath", http.Dir(filepath.Join(dirname, "static/")))

	log.Fatal(http.ListenAndServe(":52525", router))
}
