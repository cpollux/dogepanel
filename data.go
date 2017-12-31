package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/spf13/viper"
	"os/exec"
)

type Connection struct {
	Address        string `json:"addr"`
	BytesSent      uint64 `json:"bytessent"`
	BytesRecieved  uint64 `json:"bytesrecv"`
	ConnectionTime uint64 `json:"conntime"`
	Inbound        bool   `json:"inbound"`
}

type Connections []Connection

type Data struct {
	Connections *Connections `json:"connections"`
}

// Runs a shell comand and returns the produced output and error message
func runCommand(name string, args ...string) ([]byte, error) {

	out, err := exec.Command(name, args...).Output()
	if err != nil {
		return []byte{}, errors.New(fmt.Sprintf("There was an error running '%s' with the arguments '%v'. \n(%s)", name, args, err))
	}
	return out, nil
}

func getConnections() (*Connections, error) {

	out, err := runCommand(viper.GetString("cli_path"), "getpeerinfo")
	if err != nil {
		return nil, errors.New(fmt.Sprintf("There was an error running getConnections() [data.go].\nError:%s", err))
	}

	conns := Connections{}
	err = json.Unmarshal(out, &conns)
	if err != nil {
		return nil, errors.New(fmt.Sprintf("There was an error parsing the connection info in getConnections() [data.go]\nError:%s\n", err))
	}

	return &conns, nil
}

func getData() (Data, error) {

	d := Data{}

	c, err := getConnections()
	if err != nil {
		return d, err
	}
	d.Connections = c

	return d, nil
}
