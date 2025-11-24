//Двумерный массив не очень подходящая структура для решения задачи
//Сделаем массив объектов класса tube для структурирования

class ImageState{
    constructor(tubes) {
        this.tubes = tubes.map(tube => tube.clone());
        this.move = null;
        this.parent = null;
    }


    clone() {
        return new ImageState(this.tubes);
    }
    serialize() {
        return this.tubes.map(tube => tube.toArray().join(',')).join('|');
    }
    isWin() {
        return this.tubes.map(tube => {
            if (tube.isEmpty()) return true;

            const firstColor = tube.contents[0];
            return tube.contents.every(color => color === firstColor);
        }).every(result => result === true);
    }

    getPath() {
        const path = [];
        let current = this;

        while (current.move !== null) {
            path.unshift(current.move);
            current = current.parent;
        }

        return path;
    }

    getFullMoves() {

        const moves = [];

        for (let from = 0; from < this.tubes.length; from++) {
            for (let to = 0; to < this.tubes.length; to++) {
                if (from === to) continue;

                if (this.tubes[from].canPourInto(this.tubes[to])) {
                    moves.push([from, to]);
                }
            }
        }

        return moves;
    }
    applyMove(from, to) {
        const newState = this.clone();
        newState.tubes[from].pourInto(newState.tubes[to]);
        newState.move = [from, to];
        newState.parent = this;
        return newState;
    }



}


function  breadth_traversal(initialTubes){
    const startState = new  ImageState(initialTubes);
    const queue = [startState];
    const visited = new Set([]);
    let count = 0

    while (queue.length > 0) {
        const currentState = queue.shift();
        count += 1;
        if (currentState.isWin()) {
            console.log(`Решение за: ${count} `);
            return currentState.getPath();
        }

        const possibleMoves = currentState.getFullMoves();
        for (const [from, to] of possibleMoves) {
            const newState = currentState.applyMove(from, to);
            const stateKey = newState.serialize();

            if (!visited.has(stateKey)) {
                visited.add(stateKey);
                queue.push(newState);
            }
        }

        // Optional: log progress every 1000 states
        if (count % 1000 === 0) {
            console.log(`Решение ${count}, Размер очереди: ${queue.length}`);
        }
    }
    console.log(`Нет решений`);
    return []
}


class Tube {
    constructor(capacity) {
        this.capacity = capacity;
        this.contents = [];
    }
    push(color) {
        this.contents.push(color);
    }
    clone() {
        const newTube = new Tube(this.capacity);
        newTube.contents = [...this.contents];
        return newTube;
    }
    isEmpty() {
        return this.contents.length === 0;
    }
    isFull() {
        return this.contents.length === this.capacity;
    }
    getTop() {
        return this.contents.length > 0 ? this.contents[this.contents.length - 1] : null;
    }
    getAvailableSpace() {
        return this.capacity - this.contents.length;
    }
    pop() {
        if (this.isEmpty()) {
            throw new Error("Туба пустая");
        }
        return this.contents.pop();
    }
    canPourInto(otherTube) {
        if (this.isEmpty()) return false;
        if (otherTube.isFull()) return false;

        const myTopColor = this.getTop();
        const otherTopColor = otherTube.getTop();
        return otherTopColor === null || otherTopColor === myTopColor;
    }
    toArray() {
        return [...this.contents];
    }
    pourInto(otherTube) {
        if (!this.canPourInto(otherTube)) {
            throw new Error("Нельзя");
        }

        const myTopColor = this.getTop();
        let pouredCount = 0;
        const availableSpace = otherTube.getAvailableSpace();

        // Pour as many as possible of the same color
        while (!this.isEmpty() &&
        this.getTop() === myTopColor &&
        otherTube.getAvailableSpace() > 0) {
            const color = this.pop();
            otherTube.push(color);
            pouredCount++;
        }

        return pouredCount;
    }


}

function createTubesFromArray(tubesArray) {

    return tubesArray.map(tubeArr => {
        const tube = new Tube(tubesArray[0].length);
        tubeArr
            .filter(color => color !== null )
            .forEach(color => tube.push(color));

        return tube;
    });


}

function main() {

    const initialTubesArray = [
        [1, 1, 1, 1],
        [2, 2, 2, 2],
        [3, 3, 3, 3],
        [1, 2, 3, 1],
        [2, 3, 1, 2],
        [3, 1, 2, 3],
        [],
        []
    ];

    console.log("Стартовый набор:");
    initialTubesArray.forEach((tube, i) => {
        console.log(` ${i}: [${tube.join(', ')}]`);
    });
    const tubesClass = createTubesFromArray(initialTubesArray);
    console.log("\n Массив туб:\n");
    console.log(tubesClass)
    console.log(breadth_traversal(tubesClass))
}



    main()

