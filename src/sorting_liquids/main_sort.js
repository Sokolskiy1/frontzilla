
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


}



    main()

