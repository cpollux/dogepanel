package main

import (
	"github.com/julienschmidt/httprouter"
	"github.com/spf13/viper"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func main() {

	log.Println("Trying to start dogepanel:")

	log.Print(" ... Trying to locate where the dogepanel binary is executed from: ")
	ex, err := os.Executable() // get directory the binary is placed in
	if err != nil {
		log.Panicf("%s \n", err)
	}
	dirname := filepath.Dir(ex)
	log.Print("        successful")

	// Configuration (see config file for further explanation)
	log.Println(" ... Setting default config parameters.")
	viper.SetDefault("serverName", "")
	viper.SetDefault("port", 52525)
	viper.SetDefault("refreshEvery", "10")
	viper.SetDefault("blockchainPath", "/home/doger/.dogecoin/blocks")
	viper.SetDefault("cliPath", "/home/doger/dogecoin-bin/bin/dogecoin-cli")
	viper.SetDefault("uiFont", `-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif !default"`)

	// look for config file in current directory and /etc/
	viper.SetConfigName("config")
	viper.AddConfigPath("/etc")
	viper.AddConfigPath(".")

	log.Print(" ... Trying to read in config file: ")
	err = viper.ReadInConfig() // Find and read the config file
	if err != nil {            // Handle errors reading the config file
		log.Panicf("%s \n", err)
	}
	log.Println("        successful")

	// set up router
	log.Println(" ... Setting up router.")
	router := httprouter.New()
	router.GET("/", ViewPanelHandler)
	router.GET("/login", ViewLoginHandler)
	router.POST("/login", SubmitLoginHandler)
	router.GET("/data", ViewDataHandler)
	router.ServeFiles("/static/*filepath", http.Dir(filepath.Join(dirname, "static/")))

	// start listening
	log.Printf(" ... Listening on port %s.\n", viper.GetString("port"))
	err = http.ListenAndServe(viper.GetString("serverName")+":"+viper.GetString("port"), router)
	if err != nil {
		log.Panicf("%s \n", err)
	}
}
