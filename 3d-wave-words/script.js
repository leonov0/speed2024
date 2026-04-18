const CHARS = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890"

const container = document.querySelector(".container")

const words = Array.from({ length: 40 * 40 }).map(() => {
    const word = document.createElement("div")
    word.className = "word"
    word.textContent = CHARS.at(Math.floor(Math.random() * CHARS.length))
    return container.appendChild(word)
})

function draw(timestamp) {
    words.forEach((word, index) => {
        const z = Math.sin(index % 40 / 2 + timestamp / 500) * Math.sin(index / 40 / 2 + timestamp / 500) * 10
        word.style.transform = `translateZ(${z}px)`
    })

    requestAnimationFrame(draw)
}

requestAnimationFrame(draw)