#!/usr/bin/env bash

# A script to download and install the latest version

OS=$(uname)
if [[ "$OS" == "Linux" || "$OS" == "Darwin" ]]; then
    case "$OS" in
        'Linux')
            PLATFORM="linux-x64"
            if [ -z "$1" ]; then
                VERSION=$(curl --silent "https://api.github.com/repos/stencila/convert/releases/latest" | grep -Po '"tag_name": "\K.*?(?=")')
            else
                VERSION=$1
            fi
            INSTALL_PATH="$HOME/.local/bin"
            ;;
        'Darwin')
            PLATFORM="macos-x64"
            if [ -z "$1" ]; then
                VERSION=$(curl --silent "https://api.github.com/repos/stencila/convert/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
            else
                VERSION=$1
            fi
            INSTALL_PATH="/usr/local/bin"
            ;;
    esac
    
    echo "Downloading stencila-convert $VERSION"
    curl -Lo /tmp/convert.tar.gz https://github.com/stencila/convert/releases/download/$VERSION/convert-$PLATFORM.tar.gz
    tar xvf /tmp/convert.tar.gz
    rm -f /tmp/convert.tar.gz
    
    echo "Installing stencila-convert to $INSTALL_PATH/stencila-convert-$VERSION"
    mkdir -p $INSTALL_PATH/stencila-convert-$VERSION
    mv -f stencila-convert $INSTALL_PATH/stencila-convert-$VERSION
    # Unpack `node_modules` etc into the $INSTALL_PATH/convert-$VERSION
    $INSTALL_PATH/stencila-convert-$VERSION/stencila-convert --version
    
    echo "Pointing stencila-convert to $INSTALL_PATH/stencila-convert-$VERSION/stencila-convert"
    ln -sf stencila-convert-$VERSION/stencila-convert $INSTALL_PATH/stencila-convert
else
    echo "Sorry, I don't know how to install on this OS, please see https://github.com/stencila/convert#install"
fi
