# Ɖogepanel
Ɖogepanel is a web view for persons who run DogeCoin Core as full node. It shows data such as inbound/outbound connections. **Do not run the panel in production yet. The project is at an early stage and I'm looking for people who can give me some feedback and ideas.** If you want to get a message as soon as the project is production ready, leave me a message on github or reddit. (https://www.reddit.com/user/AllWeNeedIsDoge/)

![Screenshot](https://i.imgur.com/qfQoMUr.jpg])

## How to build
Ɖogepanel is tested on Debian 9, but should work fine on any other distribution.

### Requirements
- Debian/Ubuntu 32/64bit
- Go >= 1.9.2 (https://golang.org/)
- Git
- Dogecoin Core  >= 1.10

### Build
```bash
# create new user and download the repository to its installation directory
adduser doger
cd INSTALL_DIRECTORY_OF_YOUR_CHOICE
git clone https://github.com/rodneybw/dogepanel
cd dogepanel

# !!! look at the config.json to change the port and the location of your dogecoin cli executable !!!

# get dependencies
go get github.com/julienschmidt/httprouter
go get github.com/spf13/viper

# build and run
go build
./dogepanel
```

## Acknowledgements
Ɖogepanel uses these awesome libraries. :)
- **Viper** for handling the configuration file (https://github.com/spf13/viper)
- **httprouter** for routing incoming http requests (https://github.com/julienschmidt/httprouter)
- **Bootstrap** as CSS framework (http://getbootstrap.com/)


