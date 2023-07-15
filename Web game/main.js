//import * as webSerial from 'webSerial.js';

const WALL_TYPES = ["none", "wall"];
const WALL_TYPES_COLORS = { "none": "#00000000", "wall": "#000000ff" };
const WALL_TYPES_PASSABLE = { "none": true, "wall": false };

const FOG_IMG = document.createElement("img");
FOG_IMG.src = "./fog.png";
const PLAYER_IMG = document.createElement("img");
PLAYER_IMG.src = "./player.png";
const START_IMG = document.createElement("img");
START_IMG.src = "./start.png";
const FINISH_IMG = document.createElement("img");
FINISH_IMG.src = "./finish.png";

class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

var myMaze;

let sizeX = 11;
let sizeY = 11;

let maze_size = new Vec2(sizeX, sizeY);
const START = new Vec2(0, 0);
const FINISH = new Vec2(sizeX - 1, sizeY - 1);
const LANTERN_RANGE = 1;

function rand_bool() {
    const BOOL_TYPES = [true, false];
    return BOOL_TYPES[Math.round(Math.random())];
}

let reveal_cells = false;

class PlayerMaze {
    constructor(size, start, finish, lantern_range) {
        console.log(size, start, finish);
        this.size = size;
        this.vertical_walls = [];
        this.horizontal_walls = [];
        this.revealed_cells = [];
        this.start = start;
        this.player_pos = new Vec2(start.x, start.y);
        this.finish = finish;
        this.lantern_range = lantern_range;

        for (let x = 0; x < size.x; x++) {
            this.revealed_cells.push([]);
            this.vertical_walls.push([]);
            this.horizontal_walls.push([]);
            for (let y = 0; y < size.y; y++) {
                this.revealed_cells[x].push(reveal_cells);
                this.vertical_walls[x].push("wall");
                this.horizontal_walls[x].push("wall");
            }
        }

        for (let x = Math.max(start.x - lantern_range, 0); x < Math.min(start.x + lantern_range + 1, size.x); x++) {
            for (let y = Math.max(start.y - lantern_range, 0); y < Math.min(start.y + lantern_range + 1, size.y); y++) {
                this.revealed_cells[x][y] = true;
            }
        }

        // Maze generation
        // All walls were set to existing
        let cells_used = []; // 2D boolean list
        let victorypath_cells = []; // Vec2 sequence
        for (let x = 0; x < size.x; x++) {
            cells_used.push([]);
            for (let y = 0; y < size.y; y++) {
                cells_used[x].push(false);
            }
        }
        // First generate an ortogonal victory path
        let start_fin_distance = new Vec2(finish.x - start.x, finish.y - start.y);
        let start_direction = rand_bool(); // false: start horizontally; true: start vertically
        let lines_of_same_direction = Math.floor(Math.random() * Math.min(Math.abs(start_fin_distance.x), Math.abs(start_fin_distance.y)));
        if (lines_of_same_direction == 0) lines_of_same_direction = 1;
        let horizontal_lines_lenghts = []
        for (let i = 0; i < lines_of_same_direction; i++) horizontal_lines_lenghts.push(1);
        for (let i = 0; i < (start_fin_distance.x - lines_of_same_direction); i++) horizontal_lines_lenghts[Math.floor(Math.random() * horizontal_lines_lenghts.length)]++;
        let vertical_lines_lenghts = []
        for (let i = 0; i < lines_of_same_direction; i++) vertical_lines_lenghts.push(1);
        for (let i = 0; i < (start_fin_distance.y - lines_of_same_direction); i++) vertical_lines_lenghts[Math.floor(Math.random() * vertical_lines_lenghts.length)]++;
        let last_victPathCell = new Vec2(start.x, start.y);
        if (start_direction)
            for (let i = 0; i < lines_of_same_direction; i++) {
                for (let index = 0; index < horizontal_lines_lenghts[i]; index++) { // Go horizontally
                    victorypath_cells.push(new Vec2(last_victPathCell.x, last_victPathCell.y));
                    if (start_fin_distance.x > 0) last_victPathCell.x++;
                    else last_victPathCell.x--;
                }
                for (let index = 0; index < vertical_lines_lenghts[i]; index++) { // Go vertically
                    victorypath_cells.push(new Vec2(last_victPathCell.x, last_victPathCell.y));
                    if (start_fin_distance.y > 0) last_victPathCell.y++;
                    else last_victPathCell.y--;
                }
            }
        else
            for (let i = 0; i < lines_of_same_direction; i++) {
                for (let index = 0; index < vertical_lines_lenghts[i]; index++) { // Go vertically
                    victorypath_cells.push(new Vec2(last_victPathCell.x, last_victPathCell.y));
                    if (start_fin_distance.y > 0) last_victPathCell.y++;
                    else last_victPathCell.y--;
                }
                for (let index = 0; index < horizontal_lines_lenghts[i]; index++) { // Go horizontally
                    victorypath_cells.push(new Vec2(last_victPathCell.x, last_victPathCell.y));
                    if (start_fin_distance.x > 0) last_victPathCell.x++;
                    else last_victPathCell.x--;
                }
            }
        victorypath_cells.push(new Vec2(finish.x, finish.y));

        // Join the victory cells
        for (let i = 0; i < (victorypath_cells.length - 1); i++)
            if (victorypath_cells[i] != victorypath_cells[i + 1]) { // Only connect if they werent two same cells
                if ((victorypath_cells[i].x - victorypath_cells[i + 1].x) != 0) { // If the move was in X coord
                    if ((victorypath_cells[i + 1].x - victorypath_cells[i].x) == 1) // If the move was to the right
                        this.vertical_walls[victorypath_cells[i].x + 1][victorypath_cells[i].y] = "none";
                    else // If the move was to the left
                        this.vertical_walls[victorypath_cells[i].x][victorypath_cells[i].y] = "none";
                }
                else { // If the move was in Y coord
                    if ((victorypath_cells[i + 1].y - victorypath_cells[i].y) == 1) // If the move was down
                        this.horizontal_walls[victorypath_cells[i].x][victorypath_cells[i].y + 1] = "none";
                    else // If the move was up
                        this.horizontal_walls[victorypath_cells[i].x][victorypath_cells[i].y] = "none";
                }
                cells_used[victorypath_cells[i].x][victorypath_cells[i].y] = true;
            }
        let end_nodes = structuredClone(victorypath_cells);
        let can_extend;
        let cycle_counter = 0;
        while ((end_nodes.length > 10) && (cycle_counter < 1024)) {
            for (let i = (end_nodes.length - 1); i >= 0; i--) {
                can_extend = false;
                if (end_nodes[i].y > 0) // Check for the maze side
                    if (!cells_used[end_nodes[i].x][end_nodes[i].y - 1]) { // Can extend up
                        if (Math.random() > 0.5) { // Randomly decided to extend
                            this.horizontal_walls[end_nodes[i].x][end_nodes[i].y] = "none"; // Removing the wall
                            cells_used[end_nodes[i].x][end_nodes[i].y - 1] = true; // Marking the cell extended to as used
                            end_nodes.push(new Vec2(end_nodes[i].x, end_nodes[i].y - 1)); // Addinng the new node to the end nodes list
                        }
                        else {
                            can_extend = true; // If the cell beside hasnt just been used, this node is still active
                        }
                    }
                if (end_nodes[i].y < (size.y - 1)) // Check for the maze side
                    if (!cells_used[end_nodes[i].x][end_nodes[i].y + 1]) { // Can extend down
                        if (Math.random() > 0.5) { // Randomly decided to extend
                            this.horizontal_walls[end_nodes[i].x][end_nodes[i].y + 1] = "none"; // Removing the wall
                            cells_used[end_nodes[i].x][end_nodes[i].y + 1] = true; // Marking the cell extended to as used
                            end_nodes.push(new Vec2(end_nodes[i].x, end_nodes[i].y + 1)); // Addinng the new node to the end nodes list
                        }
                        else {
                            can_extend = true; // If the cell beside hasnt just been used, this node is still active
                        }
                    }
                if (end_nodes[i].x > 0) // Check for the maze side
                    if (!cells_used[end_nodes[i].x - 1][end_nodes[i].y]) { // Can extend left
                        if (Math.random() > 0.5) { // Randomly decided to extend
                            this.vertical_walls[end_nodes[i].x][end_nodes[i].y] = "none"; // Removing the wall
                            cells_used[end_nodes[i].x - 1][end_nodes[i].y] = true; // Marking the cell extended to as used
                            end_nodes.push(new Vec2(end_nodes[i].x - 1, end_nodes[i].y)); // Addinng the new node to the end nodes list
                        }
                        else {
                            can_extend = true; // If the cell beside hasnt just been used, this node is still active
                        }
                    }
                if (end_nodes[i].x < (size.x - 1)) // Check for the side
                    if (!cells_used[end_nodes[i].x + 1][end_nodes[i].y]) { // Can extend right
                        if (Math.random() > 0.5) { // Randomly decided to extend
                            this.vertical_walls[end_nodes[i].x + 1][end_nodes[i].y] = "none"; // Removing the wall
                            cells_used[end_nodes[i].x + 1][end_nodes[i].y] = true; // Marking the cell extended to as used
                            end_nodes.push(new Vec2(end_nodes[i].x + 1, end_nodes[i].y)); // Addinng the new node to the end nodes list
                        }
                        else {
                            can_extend = true; // If the cell beside hasnt just been used, this node is still active
                        }
                    }
                if (!can_extend) end_nodes.splice(i, 1);
            }
            //cycle_counter++;
        }
    }

    get finished() {
        //console.log(this.finish);
        //console.log(this.player_pos);
        console.log(this.finish.x);
        console.log(this.player_pos.x);

        console.log(this.finish.y);
        console.log(this.player_pos.y);
        return (this.finish.x == this.player_pos.x) && (this.finish.y == this.player_pos.y);
    }

    to_table(cellsize) {
        //cellsize += 2;
        let output = document.createElement("table");
        output.cellSpacing = "0pt";
        output.style.border = "3px solid #0000ffff";
        let tr;
        let td;
        for (let tr_i = 0; tr_i < this.size.y; tr_i++) {
            tr = document.createElement("tr");
            tr.style.height = cellsize;
            for (let td_i = 0; td_i < this.size.x; td_i++) {
                td = document.createElement("td");
                td.style.width = cellsize;
                td.style.borderWidth = "3px";
                if (this.revealed_cells[td_i][tr_i]) {
                    if (tr_i != 0) td.style.borderTopColor = WALL_TYPES_COLORS[this.horizontal_walls[td_i][tr_i]];
                    else td.style.borderTopColor = "#00000000";
                    if (tr_i != (this.size.y - 1)) td.style.borderBottomColor = WALL_TYPES_COLORS[this.horizontal_walls[td_i][(tr_i + 1) % this.size.y]];
                    else td.style.borderBottomColor = "#00000000";
                    if (td_i != 0) td.style.borderLeftColor = WALL_TYPES_COLORS[this.vertical_walls[td_i][tr_i]];
                    else td.style.borderLeftColor = "#00000000";
                    if (td_i != (this.size.x - 1)) td.style.borderRightColor = WALL_TYPES_COLORS[this.vertical_walls[(td_i + 1) % this.size.x][tr_i]];
                    else td.style.borderRightColor = "#00000000";
                    if ((this.player_pos.x == td_i) && (this.player_pos.y == tr_i)) td.appendChild(PLAYER_IMG.cloneNode(false));
                    else if ((this.start.x == td_i) && (this.start.y == tr_i)) td.appendChild(START_IMG.cloneNode(false));
                    else if ((this.finish.x == td_i) && (this.finish.y == tr_i)) td.appendChild(FINISH_IMG.cloneNode(false));
                }
                else {
                    td.style.borderColor = "#7f7f7fff";
                    td.appendChild(FOG_IMG.cloneNode(false));
                }
                tr.appendChild(td);
            }
            output.appendChild(tr);
        }
        this.table = output; // Used in case of just updating the table
        this.cellsize = cellsize;
        return output;
    }

    update_table() {
        let current_td;
        for (let x = Math.max(this.player_pos.x - this.lantern_range, 0); x < Math.min(this.player_pos.x + this.lantern_range + 1, this.size.x); x++)
            for (let y = Math.max(this.player_pos.y - this.lantern_range, 0); y < Math.min(this.player_pos.y + this.lantern_range + 1, this.size.y); y++) {
                current_td = this.table.childNodes[y].childNodes[x];
                while (current_td.firstChild) current_td.firstChild.remove(); // Clear all the td`s children
                if (this.revealed_cells[x][y]) {
                    if (y != 0) current_td.style.borderTopColor = WALL_TYPES_COLORS[this.horizontal_walls[x][y]];
                    else current_td.style.borderTopColor = "#00000000";
                    if (y != (this.size.y - 1)) current_td.style.borderBottomColor = WALL_TYPES_COLORS[this.horizontal_walls[x][(y + 1)]];
                    else current_td.style.borderBottomColor = "#00000000";
                    if (x != 0) current_td.style.borderLeftColor = WALL_TYPES_COLORS[this.vertical_walls[x][y]];
                    else current_td.style.borderLeftColor = "#00000000";
                    if (x != (this.size.x - 1)) current_td.style.borderRightColor = WALL_TYPES_COLORS[this.vertical_walls[(x + 1)][y]];
                    else current_td.style.borderRightColor = "#00000000";
                    if ((this.player_pos.x == x) && (this.player_pos.y == y)) current_td.appendChild(PLAYER_IMG.cloneNode(false));
                    else if ((this.start.x == x) && (this.start.y == y)) current_td.appendChild(START_IMG.cloneNode(false));
                    else if ((this.finish.x == x) && (this.finish.y == y)) current_td.appendChild(FINISH_IMG.cloneNode(false));
                }
                else {
                    current_td.style.borderColor = "#7f7f7fff";
                    current_td.appendChild(FOG_IMG.cloneNode(false));
                }
            }
        this.table.childNodes
    }

    move(direction) {
        console.log('direction ' + direction);
        if (direction == "up") if (this.player_pos.y > 0) if (WALL_TYPES_PASSABLE[this.horizontal_walls[this.player_pos.x][this.player_pos.y]]) this.player_pos.y--;
        if (direction == "left") if (this.player_pos.x > 0) if (WALL_TYPES_PASSABLE[this.vertical_walls[this.player_pos.x][this.player_pos.y]]) this.player_pos.x--;
        if (direction == "down") if (this.player_pos.y < (this.size.y - 1)) if (WALL_TYPES_PASSABLE[this.horizontal_walls[this.player_pos.x][this.player_pos.y + 1]]) this.player_pos.y++;
        if (direction == "right") if (this.player_pos.x < (this.size.x - 1)) if (WALL_TYPES_PASSABLE[this.vertical_walls[this.player_pos.x + 1][this.player_pos.y]]) this.player_pos.x++;

        for (let x = Math.max(this.player_pos.x - this.lantern_range, 0); x < Math.min(this.player_pos.x + this.lantern_range + 1, this.size.x); x++)
            for (let y = Math.max(this.player_pos.y - this.lantern_range, 0); y < Math.min(this.player_pos.y + this.lantern_range + 1, this.size.y); y++)
                this.revealed_cells[x][y] = true;
    }

    from(pos) {
        let output = {
            up: WALL_TYPES_PASSABLE[this.horizontal_walls[pos.x % this.size.x][pos.y % this.size.y]],
            left: WALL_TYPES_PASSABLE[this.vertical_walls[pos.x % this.size.x][pos.y % this.size.y]],
            down: WALL_TYPES_PASSABLE[this.horizontal_walls[pos.x % this.size.x][(pos.y + 1) % this.size.y]],
            right: WALL_TYPES_PASSABLE[this.vertical_walls[(pos.x + 1) % this.size.x][pos.y % this.size.y]]
        };
        if (this.player_pos.x == 0) output.left = false;
        else if (this.player_pos.x == (this.size.x + 1)) output.right = false;
        if (this.player_pos.y == 0) output.up = false;
        else if (this.player_pos.y == (this.size.x + 1)) output.down = false;
        return output;
    }

    ways() {
        let output = {
            up: WALL_TYPES_PASSABLE[this.horizontal_walls[this.player_pos.x % this.size.x][this.player_pos.y % this.size.y]],
            left: WALL_TYPES_PASSABLE[this.vertical_walls[this.player_pos.x % this.size.x][this.player_pos.y % this.size.y]],
            down: WALL_TYPES_PASSABLE[this.horizontal_walls[this.player_pos.x % this.size.x][(this.player_pos.y + 1) % this.size.y]],
            right: WALL_TYPES_PASSABLE[this.vertical_walls[(this.player_pos.x + 1) % this.size.x][this.player_pos.y % this.size.y]]
        };
        if (this.player_pos.x == 0) output.left = false;
        else if (this.player_pos.x == (this.size.x + 1)) output.right = false;
        if (this.player_pos.y == 0) output.up = false;
        else if (this.player_pos.y == (this.size.x + 1)) output.down = false;
        return output;
    }
}

const ARROWKEYS = { up: document.createElement("img"), left: document.createElement("img"), down: document.createElement("img"), right: document.createElement("img") };
const arrows_display = document.getElementById("arrowsdisplay");

let maze_display;

let voteButton = document.getElementById('vote');
let singleButton = document.getElementById('single');
let selectionButton = document.getElementById('submit-selection');

console.log(voteButton);

voteButton.addEventListener('click', (e) => {
    document.getElementById('vote-game').style.display = 'block';
    voteButton.style.display = 'none';
    singleButton.style.display = 'none';
    maze_display = document.getElementById("mazedisplay");
    myMaze = new PlayerMaze(maze_size, START, FINISH, LANTERN_RANGE);
    while (maze_display.firstChild)
        maze_display.firstChild.remove();
    maze_display.appendChild(myMaze.to_table("64px"));
    update_maze(myMaze);

});

singleButton.addEventListener('click', (e) => {
    document.getElementById('singleplayer').style.display = 'block';
    voteButton.style.display = 'none';
    singleButton.style.display = 'none';

});


selectionButton.addEventListener('click', (e) => {
    sizeX = document.getElementById('size-x').value;
    sizeY = document.getElementById('size-y').value;
    maze_size = new Vec2(sizeX, sizeY);
    document.getElementById('size-selection').style.display = 'none';
    document.getElementById('single-game').style.display = 'block';
    maze_display = document.getElementById('mazedisplay-single');

    myMaze = new PlayerMaze(maze_size, START, new Vec2(sizeX - 1, sizeY - 1), LANTERN_RANGE);
    while (maze_display.firstChild)
        maze_display.firstChild.remove();
    maze_display.appendChild(myMaze.to_table("64px"));
    update_maze(myMaze);


});

document.addEventListener('keydown', (e) => {
    //console.log(e);
    if (e.key == 'w') {
        //console.log('w pressed' || e.key == 'ArrowUp');
        myMaze.move('up');
        update_maze(myMaze);
    } else if (e.key == 'a' || e.key == 'ArrowLeft') {
        //console.log('a pressed');
        myMaze.move('left');
        update_maze(myMaze);
    } else if (e.key == 's' || e.key == 'ArrowDown') {
        //console.log('s pressed');
        myMaze.move('down');
        update_maze(myMaze);
    } else if (e.key == 'd' || e.key == 'ArrowRight') {
        //console.log('d pressed');
        myMaze.move('right');
        update_maze(myMaze);
    }
});
//odstranit myMaze pro singleplayer
function update_maze() {
    let directions = myMaze.ways();

    ARROWKEYS.up.src = "./arrow images/enabled/uparrow_enabled";
    ARROWKEYS.up.style = 'position: absolute; left: calc(100%/3);';
    ARROWKEYS.up.onclick = function () {
        myMaze.move("up");
        update_maze(myMaze);
    }
    arrows_display.appendChild(ARROWKEYS.up);

    ARROWKEYS.left.src = "./arrow images/enabled/leftarrow_enabled";
    ARROWKEYS.left.style = 'position: absolute;  top: calc(100%/3);';
    ARROWKEYS.left.onclick = function () {
        myMaze.move("left");
        update_maze(myMaze);
    }
    arrows_display.appendChild(ARROWKEYS.left);

    ARROWKEYS.down.src = "./arrow images/enabled/downarrow_enabled";
    ARROWKEYS.down.style = 'position: absolute; top: calc(2*(100%/3)); left: calc(100%/3);';
    ARROWKEYS.down.onclick = function () {
        myMaze.move("down");
        update_maze(myMaze);
    }
    arrows_display.appendChild(ARROWKEYS.down);

    ARROWKEYS.right.src = "./arrow images/enabled/rightarrow_enabled";
    ARROWKEYS.right.style = 'position: absolute; left: calc(2*(100%/3));top: calc(100%/3);';
    ARROWKEYS.right.onclick = function () {
        myMaze.move("right");
        update_maze(myMaze);
    }
    arrows_display.appendChild(ARROWKEYS.right);

    ARROWKEYS.up.src = "./arrow images/disabled/uparrow_disabled.png";
    ARROWKEYS.left.src = "./arrow images/disabled/leftarrow_disabled.png";
    ARROWKEYS.down.src = "./arrow images/disabled/downarrow_disabled.png";
    ARROWKEYS.right.src = "./arrow images/disabled/rightarrow_disabled.png";

    if (directions.up) ARROWKEYS.up.src = "./arrow images/enabled/uparrow_enabled.png";
    if (directions.left) ARROWKEYS.left.src = "./arrow images/enabled/leftarrow_enabled.png";
    if (directions.down) ARROWKEYS.down.src = "./arrow images/enabled/downarrow_enabled.png";
    if (directions.right) ARROWKEYS.right.src = "./arrow images/enabled/rightarrow_enabled.png";

    myMaze.update_table();
    if (myMaze.finished) {
        myMaze = new PlayerMaze(maze_size, START, new Vec2(maze_size.x - 1, maze_size.y - 1), LANTERN_RANGE);
        //console.log('generated new maze');
        while (maze_display.firstChild)
            maze_display.firstChild.remove();
        maze_display.appendChild(myMaze.to_table("64px"));
        update_maze(myMaze);
    }
}

navigator.serial.addEventListener("connect", (e) => {
    console.log(e);
    // Connect to `e.target` or add it to a list of available ports.
});

navigator.serial.addEventListener("disconnect", (e) => {
    // Remove `e.target` from the list of available ports.
});

navigator.serial.getPorts().then((ports) => {
    // Initialize the list of available ports with `ports` on page load.
});

var labels = { up: document.getElementById('up_arrow_votes'), left: document.getElementById('left_arrow_votes'), down: document.getElementById('down_arrow_votes'), right: document.getElementById('right_arrow_votes'), };

button = document.getElementById('test-button');

serialInit('0x303A', button, (value) => {

    //console.log(value);
    let input = readStringFromSerial(value);

    if (input == 'up' || input == 'left' || input == 'down' || input == 'right') {
        //console.log(input);
        myMaze.move(input);
        update_maze(myMaze);
    } else if (input != 'undefined' || input != 'null' || input != '' || input != null || input != undefined || input != "") {
        input = JSON.parse(input);
        //console.log(input);
        labels.up.innerHTML = 'Hlasy: ' + input[0];
        labels.left.innerHTML = 'Hlasy: ' + input[1];
        labels.down.innerHTML = 'Hlasy: ' + input[2];
        labels.right.innerHTML = 'Hlasy: ' + input[3];
        //console.log(JSON.parse(input));
    } else {
        //console.log(input);
    }
});

/*
button.addEventListener("click", () => {
    const usbVendorId = '0x303A';
    navigator.serial
        .requestPort({ filters: [{ usbVendorId }] })
        .then(async (port) => {
            await port.open({ baudRate: 921600 });
            while (port.readable) {
                const reader = port.readable.getReader();
                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) {
                            console.log('Ended');
                            // |reader| has been canceled.
                            break;
                        }

                        let length = value.byteLength;
                        let outputBytes = [];
                        let previousNum = null;

                        for (let i = 0; i < length; i++) {
                            if (previousNum == 16) {
                                if (value[i] == 10) {
                                    break;
                                }
                                outputBytes.push(value[i]);
                                //console.log('outputBytes: ' + outputBytes);
                            } else {
                                previousNum = value[i];
                            }
                        }

                        let input = String.fromCharCode(...outputBytes);
                        console.log(input);
                        if (input == 'up' || input == 'left' || input == 'down' || input == 'right') {
                            console.log(input);
                            myMaze.move(input);
                            update_maze(myMaze);
                        } else if (input != 'undefined' || input != 'null' || input != '' || input != null || input != undefined || input != "") {
                            input = JSON.parse(input);
                            //console.log(input);
                            labels.up.innerHTML = 'Hlasy: ' + input[0];
                            labels.left.innerHTML = 'Hlasy: ' + input[1];
                            labels.down.innerHTML = 'Hlasy: ' + input[2];
                            labels.right.innerHTML = 'Hlasy: ' + input[3];
                            //console.log(JSON.parse(input));
                        } else {
                            //console.log(input);
                        }
                        let TEST = '';
                        TEST += '12';
                        // Do something with |value|...
                    }
                } catch (error) {
                    // Handle |error|...
                } finally {
                    reader.releaseLock();
                }
            }

        })
        .catch((e) => {
            // The user didn't select a port.
        });
});
*/