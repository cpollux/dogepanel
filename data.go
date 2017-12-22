package main

import (
	"os/exec"
	"github.com/spf13/viper"
	"path/filepath"
	"fmt"
)

type Connection struct {
	address        string `json:"addr"`
	bytesSent      uint64 `json:"bytessent"`
	bytesRecieved  uint64 `json:"bytesrecv"`
	connectionTime uint64 `json:"conntime"`
	inbound        bool   `json:"inbound"`
}

type Wallet struct {
	version uint32  `json:"walletversion"`
	balance float64 `json:"balance"`
}

func getData() (*[]Connection, *Wallet, error) {

	_ = filepath.Join(viper.GetString("bin_directory"), "dogecoin-cli")

	return nil, nil, nil
}
