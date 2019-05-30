#!/usr/bin/env bash

# A script to download and install the latest version

OS=$(uname)
if [[ "$OS" == "Linux" || "$OS" == "Darwin" ]]; then
    case "$OS" in
        'Linux')
            PLATFORM="linux-x64"
            if [ -z "$1" ]; then
                VERSION=$(curl --silent "https://api.github.com/repos/stencila/encoda/releases/latest" | grep -Po '"tag_name": "\K.*?(?=")')
            else
                VERSION=$1
            fi
            INSTALL_PATH="$HOME/.local/bin"
            ;;
        'Darwin')
            PLATFORM="macos-x64"
            if [ -z "$1" ]; then
                VERSION=$(curl --silent "https://api.github.com/repos/stencila/encoda/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
            else
                VERSION=$1
            fi
            INSTALL_PATH="/usr/local/bin"
            ;;
    esac
    
    echo "Downloading encoda $VERSION"
    curl -Lo /tmp/encoda.tar.gz https://github.com/stencila/encoda/releases/download/$VERSION/encoda-$PLATFORM.tar.gz
    tar xvf /tmp/encoda.tar.gz
    rm -f /tmp/encoda.tar.gz
    
    echo "Installing encoda to $INSTALL_PATH/encoda-$VERSION"
    mkdir -p $INSTALL_PATH/encoda-$VERSION
    mv -f encoda $INSTALL_PATH/encoda-$VERSION
    # Unpack `node_modules` etc into the $INSTALL_PATH/encoda-$VERSION
    $INSTALL_PATH/encoda-$VERSION/encoda --version
    
    echo "Pointing encoda to $INSTALL_PATH/encoda-$VERSION/encoda"
    ln -sf encoda-$VERSION/encoda $INSTALL_PATH/encoda
else
    echo "Sorry, I don't know how to install on this OS, please see https://github.com/stencila/encoda#install"
fi
