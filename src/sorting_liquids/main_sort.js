//Двумерный массив не очень подходящая структура для решения задачи
//Сделаем массив объектов класса tube для структурирования

class Tube {
    constructor(capacity) {
        this.capacity = capacity;
        this.contents = [];
    }
    push(color) {
        this.contents.push(color);
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
}



    main()

