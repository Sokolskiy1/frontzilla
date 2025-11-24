//Двумерный массив не очень подходящая структура для решения задачи
//Сделаем массив объектов класса tube для структурирования

class ImageState{
    constructor(tubes) {
        this.initialTubes = tubes.map(tube => tube.clone());
        this.move = null;
        this.parent = null;
    }


    clone() {
        return new ImageState(this.initialTubes);
    }

    isWin() {
        return this.initialTubes.map(tube => {
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



}


function  breadth_traversal(initialTubes){
    const startState = new  ImageState(initialTubes);
    const queue = [startState];
    const visited = new Set([]);
    let count = 0

    while (queue.length > 0) {
        const currentState = queue.shift();
        console.log(currentState)
        count += 1;
        if (currentState.isWin()) {
            console.log(`Решение за: ${count} `);
            return currentState.getPath();
        }

    }
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

