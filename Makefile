all: setup cover

setup:
	npm install

lint:
	npm run lint

test:
	npm test

test-diffs:
	npm run test-diffs

cover:
	npm run cover

clean:
	npm run clean
