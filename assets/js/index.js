document.addEventListener("DOMContentLoaded", () => {
    init_cross_frame_state();
    attachListeners();

    console.log("event listeners attached");
});

const getMoveable = () => document.getElementById("moveable");

function attachListeners() {
    addEventListener("keydown", KeyDownManager);
    console.log("attached keydown listener");
    addEventListener("keyup", KeyUpManager);
    console.log("attached keyup listener");
    addEventListener("mousedown", OnMouseDownManager);

    window.requestAnimationFrame(animation_step);
}

const cross_frame_state = new Map();

function init_cross_frame_state() {
    cross_frame_state.set(
        getMoveable().id,
        {
            start: undefined,
            time: undefined,
            timescale_factor: 3.0 + 1.0/3.0
        }
    );
}

// technically if we wanted to use maps to functions we don't really need two separete maps, 
// just a nested KV -> KV −> function pair
const startMap = new Map([[37, startLeft], [38, startUp], [39, startRight], [40, startDown]]);
const stopMap = new Map([[37, stopLeft], [38, stopUp], [39, stopRight], [40, stopDown]]);

// realistically these could be de-duplicated
// each attribute is also prefixed by essentially a namespace to avoid the *very* unlikely
// scenario of conflicting qualified names
function startLeft() {
    const moveable = getMoveable();
    moveable.setAttribute("__moveable_event_Left", "on");
};
function startUp() {
    const moveable = getMoveable();
    moveable.setAttribute("__moveable_event_Up", "on");
};
function startRight() {
    const moveable = getMoveable();
    moveable.setAttribute("__moveable_event_Right", "on");
};
function startDown() {
    const moveable = getMoveable();
    moveable.setAttribute("__moveable_event_Down", "on");
};

function stopLeft() {
    const moveable = getMoveable();
    moveable.removeAttribute("__moveable_event_Left");
};
function stopUp() {
    const moveable = getMoveable();
    moveable.removeAttribute("__moveable_event_Up");
};
function stopRight() {
    const moveable = getMoveable();
    moveable.removeAttribute("__moveable_event_Right");
};
function stopDown() {
    const moveable = getMoveable();
    moveable.removeAttribute("__moveable_event_Down");
};


function KeyDownManager(event) {
    console.log(event);
    const keyCode = event.keyCode;
    try {
        startMap.get(keyCode)();
    } catch (error) {
        if (!(error instanceof TypeError))
        {
            console.error(error);
        }
    }
}

function KeyUpManager(event) {
    console.log(event);
    const keyCode = event.keyCode;
    try {
        stopMap.get(keyCode)();
    } catch (error) {
        if (!(error instanceof TypeError))
            {
                console.error(error);
            }
    }
}

function OnMouseDownManager(event) {
    console.log(event);
    // left mouse button down
    if (event.buttons === 1)
    {
        const moveable = getMoveable();
        
        const moveable_rect = moveable.getClientRects()[0];
        const valid_bounds = valid_bounds_for(moveable_rect);

        // center
        let x = event.clientX - moveable_rect.width / 2;
        let y = event.clientY - moveable_rect.height / 2;

        // keep within bounds
        x = clamp(x, valid_bounds[0], valid_bounds[2]);
        y = clamp(y, valid_bounds[1], valid_bounds[3]);

        moveable.style.translate = `${x}px ${y}px`;
    }
}

function valid_bounds_for(target_rect) {
    return [
        0, 0,
        window.visualViewport.width - target_rect.width,
        window.visualViewport.height - target_rect.height,
    ]
}


function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

// TODO acceleration? collision detection between elements
function animation_step(time) {
    const moveable = getMoveable();
    const state = cross_frame_state.get(moveable.id);
    if (!state.time)
    {
        state.start = time;
        state.time = time;
    }
    state.time = time;
    const delta = state.start / state.time;
    state.start = time;

    const viewport_height = window.visualViewport.height;
    const viewport_width = window.visualViewport.width;
    const moveable_rect = moveable.getClientRects()[0];

    const valid_bounds = [
        0,
        0, 
        viewport_width - moveable_rect.width,
        viewport_height - moveable_rect.height,
    ];
    let speed = 1.0 * state.timescale_factor;
    // console.log(
    //     `
    //     start: ${state.start}
    //     time: ${state.time}
    //     delta: ${delta}
    //     speed: ${speed}
    //     diagonal_speed: ${speed / Math.SQRT2}
    //     delta_speed: ${speed * delta}
    //     delta_diagonal_speed: ${(speed / Math.SQRT2) * delta}
    //     `);
    let x = moveable_rect.x;
    let y = moveable_rect.y;

    const left = moveable.getAttribute("__moveable_event_Left");
    const up = moveable.getAttribute("__moveable_event_Up");
    const right = moveable.getAttribute("__moveable_event_Right");
    const down = moveable.getAttribute("__moveable_event_Down");
    
    const diagonal = Boolean(left && up || left && down || right && up || right && down);

    if (diagonal === true)
    {
        speed = speed / Math.SQRT2;
    }

    if (left === "on")
    {
        x -= speed * delta;
    }
    if (right === "on")
    {
        x += speed * delta;
    }
    if (up === "on")
    {
        y -= speed * delta;
    }
    if (down === "on")
    {
        y += speed * delta;
    }

    x = clamp(x, valid_bounds[0], valid_bounds[2]);
    y = clamp(y, valid_bounds[1], valid_bounds[3]);

    moveable.style.translate = `${x}px ${y}px`;

    window.requestAnimationFrame(animation_step);
}