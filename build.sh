#!/bin/sh

set -e

# Build binaries (see `pkg` in `package.json` for details)
npx pkg --out-path bin .

# Zip binaries with renaming appropriate to the platform
cd bin
tar --transform='flags=r;s|encoda-linux|encoda|' -czvf x86_64-unknown-linux-gnu.tar.gz encoda-linux
tar --transform='flags=r;s|encoda-macos|encoda|' -czvf x86_64-apple-darwin.tar.gz encoda-macos
mv encoda-win.exe encoda.exe && zip x86_64-pc-windows-msvc.zip encoda.exe
