all: lint format cover build

node_modules: package.json
	npm install --legacy-peer-deps

setup: node_modules

format:
	npm run format

lint:
	npm run lint

test:
	npm test

cover:
	npm run test:cover

check:
	npm run check

build:
	npm run build
.PHONY: build

clean:
	npm run clean
