try:
    cp ./tests/test.mp3 ./test.mp3
    bun run build
    ./id3-edit test.mp3

# Clean test files and build artifacts
clean:
    rm ./*.mp3
    rm .*.bun-build
