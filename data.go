package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/spf13/viper"
	"os"
	"os/exec"
	"path/filepath"
)

type BlockchainInfo struct {
	BlockCount  uint64  `json:"blocks"`
	Difficulty  float64 `json:"difficulty"`
	MemoryUsage uint64  `json:"memoryUsage"` // bytes
}

type Connection struct {
	Address        string `json:"addr"`
	BytesSent      uint64 `json:"bytessent"`
	BytesRecieved  uint64 `json:"bytesrecv"`
	ConnectionTime uint64 `json:"conntime"`
	Inbound        bool   `json:"inbound"`
}

// type Connections []Connection

type NetworkInfo struct {
	BytesSent 	  uint64       `json:"totalbytessent"`
	BytesRecieved uint64 	   `json:"totalbytesrecv"`
	Connections   []Connection `json:"connections"`
}

type Data struct {
	BlockchainInfo *BlockchainInfo `json:"blockchainInfo"`
	NetworkInfo    *NetworkInfo    `json:"networkInfo"`
}

// Runs a shell comand and returns the produced output and error message
func runCommand(name string, args ...string) ([]byte, error) {

	out, err := exec.Command(name, args...).Output()
	if err != nil {
		return []byte{}, errors.New(fmt.Sprintf("There was an error running '%s' with the arguments '%v'. \n(%s)", name, args, err))
	}
	return out, nil
}

// Calculates the total size of a directory.
func dirSize(path string) (uint64, error) {
	var size int64
	err := filepath.Walk(path, func(_ string, info os.FileInfo, err error) error {
		if !info.IsDir() {
			size += info.Size()
		}
		return err
	})
	return uint64(size), err
}

// Returns informations about the blockchain status stored on your node.
func getBlockchainInfo() (*BlockchainInfo, error) {

	// run cli to get block count and difficulty
	out, err := runCommand(viper.GetString("cliPath"), "getblockchaininfo")
	if err != nil {
		return nil, errors.New(fmt.Sprintf("There was an error running getBlockchainInfo() [data.go].\nError:%s", err))
	}

	info := BlockchainInfo{}
	err = json.Unmarshal(out, &info)
	if err != nil {
		return nil, errors.New(fmt.Sprintf("There was an error parsing the blockchain info json in getBlockchainInfo() [data.go]\nError:%s\n", err))
	}

	// get the blockchain memory usage by scanning the directory
	path := viper.GetString("blockchainPath")
	size, err := dirSize(path)
	if err != nil {
		return nil, errors.New(fmt.Sprintf("There was an error reading the blockchain directory (%s) in getBlockchainInfo() [data.go]\nError:%s\n", path, err))
	}

	info.MemoryUsage = size
	return &info, nil
}

func getNetworkInfo() (*NetworkInfo, error) {

	info := NetworkInfo{}

	// get traffic stats
	out, err := runCommand(viper.GetString("cliPath"), "getnettotals")
	if err != nil {
		return nil, errors.New(fmt.Sprintf("There was an error running getNetworkInfo() [data.go].\nError:%s", err))
	}	

	err = json.Unmarshal(out, &info)
	if err != nil {
		return nil, errors.New(fmt.Sprintf("There was an error parsing the traffic stats in getConnections() [data.go]\nError:%s\n", err))
	}

	// get connections
	out, err = runCommand(viper.GetString("cliPath"), "getpeerinfo")
	if err != nil {
		return nil, errors.New(fmt.Sprintf("There was an error running getNetworkInfo() [data.go].\nError:%s", err))
	}	

	err = json.Unmarshal(out, &info.Connections)
	if err != nil {
		return nil, errors.New(fmt.Sprintf("There was an error parsing the connection info in getConnections() [data.go]\nError:%s\n", err))
	}

	return &info, nil
}

func getData() (Data, error) {

	d := Data{}

	blockchainInfo, err := getBlockchainInfo()
	if err != nil {
		return d, err
	}

	d.BlockchainInfo = blockchainInfo

	info, err := getNetworkInfo()
	if err != nil {
		return d, err
	}
	d.NetworkInfo = info;

	return d, nil
}
