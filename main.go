package main

import (
	"github.com/julienschmidt/httprouter"
	"github.com/spf13/viper"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"fmt"
)

func main() {

	ex, err := os.Executable() // get directory the binary is placed in
	if err != nil {
		panic(err)
	}
	dirname := filepath.Dir(ex)

	// Configuration (see config file for further explanation)
	viper.SetDefault("server_name", "")
	viper.SetDefault("port", 52525)
	viper.SetDefault("refresh_every", "10")
	viper.SetDefault("bin_directory", "/home/doger/dogecoin-bin/bin")

	// look for config file in current directory and /etc/
	viper.SetConfigName("config")
	viper.AddConfigPath("/etc")
	viper.AddConfigPath(".")

	err = viper.ReadInConfig() // Find and read the config file
	if err != nil { // Handle errors reading the config file
		panic(fmt.Errorf("Fatal error config file: %s \n", err))
	}

	// start reading data
	_, _, _ = getData()

	// set up router
	router := httprouter.New()
	router.GET("/", ViewPanelHandler)
	router.GET("/login", ViewLoginHandler)
	router.POST("/login", SubmitLoginHandler)
	router.GET("/data", ViewDataHandler)
	router.ServeFiles("/static/*filepath", http.Dir(filepath.Join(dirname, "static/")))

	// start listening
	log.Fatal(http.ListenAndServe(viper.GetString("server_name")+":"+viper.GetString("port"), router))


}
