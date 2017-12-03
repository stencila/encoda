all: setup cover

setup:
	npm install

lint:
	npm run lint

test:
	npm test
.PHONY: test

cover:
	npm run cover

clean:
	npm run clean
