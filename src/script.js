    const SIZE = 15;
    let layout = { walls:[], targets:[], player:{}, boxes:[] };
    let wallIndices = new Set();
    let boxIndices = [];
    let targetIndices = [];
    let currentMode = 0; // 0:Random, 1:Load, 2:Walls, 3:Entities
	let isRelocatingPlayer = false; // Track if we are in "move player" mode
	let idxOLD = -1

    const getIdx = (r, c) => r * SIZE + c;//MAYBE AT OLDER VERSIONS
    const getCoords = (idx) => ({ r: Math.floor(idx / SIZE), c: idx % SIZE });//MAYBE AT OLDER VERSIONS

    function setMode(m) {
	  if(m==1){  LoadSaveMode("OpenUpdate"); }//openUpdate...
	    currentMode = m;
        document.querySelectorAll('.menu-opt').forEach((el, i) => el.classList.toggle('active', i === m));
        log(`Switched to: ${document.querySelectorAll('.menu-opt')[m].innerText}`);
    }

    function initGame() {
        const configArea = document.getElementById('config');
        let cfg = JSON.parse(configArea.value);
		const grid = document.getElementById('game-grid');
        grid.innerHTML = ''; wallIndices.clear();

        // Build Grid with Click Listeners
        for(let i=0; i<225; i++) {//ONLY FOR 15x15 . IF 16x16 AND MORE CHANGE ...
            const d = document.createElement('div'); 
            d.id = `idx${i}`; d.className = 'cell';
            d.onclick = () => handleCellClick(i);
            grid.appendChild(d);
        }

        if (currentMode === 0) {
            // RANDOM GENERATION
            boxIndices = [];
			
			//COPILOT CREATION, WHILE ALMOST EVERYTHING ELSE IS GEMINI CREATION
			const topC = [...Array(SIZE).keys()]; 
			const bottomC = topC.map(i => i + SIZE * (SIZE - 1)); 
			const leftC = Array.from({length: SIZE}, (_, r) => r * SIZE); 
			const rightC = leftC.map(i => i + (SIZE - 1)); 
			const borderC = [...new Set([...topC, ...bottomC, ...leftC, ...rightC])];
			const edgeExclusions = new Uint8Array([...borderC]);//ONLY FOR 15x15. IF 16x16 AND MORE CHANGE TO Int16Array
            //const edgeExclusions = new Uint8Array([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,29,30,44,45,59,60,74,75,89,90,104,105,119,120,134,135,149,150,164,165,179,180,194,195,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224]);
            
			while(boxIndices.length < cfg.nBoxes) {
                let idx = 32 + Math.floor(Math.random() * 160);
                if (!boxIndices.includes(idx) && !edgeExclusions.includes(idx)) boxIndices.push(idx);
            }
            let others = [];
            while(others.length < 1 + cfg.nBoxes + cfg.nWalls) {
                let idx = Math.floor(Math.random() * 225);
                if (!boxIndices.includes(idx) && !others.includes(idx)) others.push(idx);
            }
            cfg.iPlayer = others[0];
            targetIndices = others.slice(1, 1 + cfg.nBoxes).sort((a,b)=>a-b);
            cfg.aWalls = others.slice(1 + cfg.nBoxes);
        } else {
            // LOAD FROM CONFIG
            boxIndices = cfg.aBoxes;
            targetIndices = cfg.aTargets;
        }

        // Apply Config to Layout
        //layout.player = getCoords(cfg.iPlayer);
	layout.player = cfg.iPlayer; 
    boxIndices.sort((a,b)=>a-b);
    targetIndices.sort((a,b)=>a-b);
    cfg.aWalls.forEach(idx => wallIndices.add(idx));

        syncConfig();
        drawBoard();
        //renderEntities(layout.player, layout.boxes, -1);
		renderEntities(layout.player, boxIndices, -1);
        log("---<br>> Map Ready.");
    }
 
    function isCornered(idx) {
    const r = Math.floor(idx / SIZE);
    const c = idx % SIZE;
    const up = wallIndices.has(idx - SIZE) || r === 0;
    const down = wallIndices.has(idx + SIZE) || r === SIZE - 1;
    const left = wallIndices.has(idx - 1) || c === 0;
    const right = wallIndices.has(idx + 1) || c === SIZE - 1;
    return (up && left) || (up && right) || (down && left) || (down && right);
	}

function handleCellClick(idx) {
const cfg = JSON.parse(document.getElementById('config').value);
    // IF PLAYER IS CLICKED: Start relocation mode
    if (idx === layout.player && [2,3].includes(currentMode)) {
        isRelocatingPlayer = true;
        document.getElementById(`idx${idx}`).classList.add('relocating');
		idxOLD=idx;
        log("Select an empty cell to reposition the player...");
        
        // Auto-cancel after 5 seconds
        setTimeout(() => {
            if (isRelocatingPlayer) {
                isRelocatingPlayer = false;
                document.getElementById(`idx${idx}`).classList.remove('relocating');
                log("Repositioning timed out.");
            }
        }, 5000);
        return;
    }

    // IF RELOCATION IS ACTIVE: Move player to empty cell
    if (isRelocatingPlayer && [2,3].includes(currentMode)) {
        if (wallIndices.has(idx) || boxIndices.includes(idx)) {
            log("Cannot move player onto a wall or box!");
            return;
        }
        layout.player = idx;
		document.getElementById(`idx${idxOLD}`).innerHTML='';
        isRelocatingPlayer = false;
        log(`Player moved to index ${idx}`);
        syncConfig();
        drawBoard();
        renderEntities(layout.player, boxIndices, -1);
        return;
    }
    
// STANDARD MODE LOGIC
    if (currentMode === 2) { 
        boxIndices = boxIndices.filter(i => i !== idx);
        targetIndices = targetIndices.filter(i => i !== idx);
        wallIndices.has(idx) ? wallIndices.delete(idx) : wallIndices.add(idx);
   } else if (currentMode === 3) { 
        // Mode 3: Toggle BOX -> TARGET -> BLANK
        // Remove wall if placing an entity
        wallIndices.delete(idx);
		//
        if (boxIndices.includes(idx)) {
            // If it was a box, move it to target
            boxIndices = boxIndices.filter(i => i !== idx);
			document.getElementById(`idx${idx}`).innerText = '';
            targetIndices.push(idx);
        } else if (targetIndices.includes(idx)) {
            // If it was a target, make it blank
            targetIndices = targetIndices.filter(i => i !== idx);
            // Explicitly clear the emoji from the DOM for this cell
            document.getElementById(`idx${idx}`).innerText = '';
        } else {
            // If it was blank, make it a box
            boxIndices.push(idx);
        }
    }

    syncConfig();
    drawBoard();
    //renderEntities(layout.player, layout.boxes, -1);
	renderEntities(layout.player, boxIndices, -1);
}

function syncConfig() {
    const area = document.getElementById('config');
    let cfg = JSON.parse(area.value);
    
    // Update data
    cfg.aBoxes = boxIndices.sort((a,b)=>a-b);
    cfg.aTargets = targetIndices.sort((a,b)=>a-b);
    cfg.aWalls = Array.from(wallIndices).sort((a,b)=>a-b);
    cfg.iPlayer = layout.player;
    cfg.nBoxes = boxIndices.length;
	cfg.nWalls = wallIndices.size // it is a set
    cfg.dateCreated = new Date().toISOString()

    // 1. Create the standard "pretty" JSON with 2-space indentation
    let jsonString = JSON.stringify(cfg, null, 2);

    // 2. THE FIX: Use Regex to collapse aBoxes and aTargets specifically
    // This looks for "aBoxes": [ followed by newlines/spaces and values, then ]
    // It captures the content inside the brackets and removes all internal newlines/extra spaces.
    const keysToCollapse = ["aBoxes", "aTargets"];
    
    keysToCollapse.forEach(key => {
        const regex = new RegExp(`("${key}":\\s*\\[)([\\s\\S]*?)(\\])`, "g");
        jsonString = jsonString.replace(regex, (match, opening, content, closing) => {
            // Remove all newlines and reduce multiple spaces to a single space
            const collapsedContent = content.replace(/\s+/g, "").trim();
            return `${opening} ${collapsedContent} ${closing}`;
        });
    });

    area.value = jsonString;
}

async function solve() {
    const configArea = document.getElementById('config');
    const cfg = JSON.parse(configArea.value);
    const mode = cfg.solverMode || 5;
    const startTime = Date.now();
    const TIME_LIMIT = cfg.timeLimit*1000;

    log(`<b>Starting Solver [Mode: ${mode}]</b>`);

	// 1. Initial Deadlock Check (Using Index Math)
    for (let bIdx of boxIndices) {
        if (isCornered(bIdx) && !targetIndices.includes(bIdx)) {
            log(`<span style='color:#f85149'>Abort: Box at ${bIdx} is cornered.</span>`);
            return;
        }
    }
	if (boxIndices.length!=targetIndices.length) {
	  log(`<span style='color:#f85149'>Abort: The number of boxes (${boxIndices.length}) must be equal to the number of targets (${targetIndices.length})!</span>`);
      return;
    }

    // --- HELPER: SBDT Pairing Logic ---
		const sbdtPairing = (boxes, targets) => {
        log("<i>SBDT: Running Density-Based Pairing...</i>");
            const LURD = [-1, -SIZE, 1, SIZE];
            const Diag = [-SIZE-1, -SIZE+1, SIZE-1, SIZE+1];
			
        // 1. Calculate Box Points (Lowest = Best/Freest)
        let boxData = boxes.map((bIdx, originalArrayIdx) => {
            let ptsb = 1;
            LURD.forEach(off => {
                let n = bIdx + off;
                if (wallIndices.has(n)) ptsb += 4;//2->4
                else if (boxes.includes(n)) ptsb += 2;//1->2
            });
            Diag.forEach(off => {
                let n = bIdx + off;
                if (wallIndices.has(n)) ptsb += 1;//2->1
                else if (boxes.includes(n)) ptsb += 1;
            });
            return { bIdx, originalArrayIdx, ptsb };
        });

        // 2. Calculate Target Points (Highest = Best/Deepest)
        let targetData = targets.map((tIdx, originalArrayIdx) => {    //targetIndices ?
            let pts = 1;
            LURD.forEach(off => {
                let n = tIdx + off;
                let isOut = (n < 0 || n >= 225 || (Math.abs(off) === 1 && Math.floor(n/SIZE) !== Math.floor(tIdx/SIZE)));
                if (isOut || wallIndices.has(n)) pts += 5;  //2->5
                else if (targets.includes(n)) pts += 2;  //1->2
            });
            Diag.forEach(off => {
                let n = tIdx + off;
                let isOut = (n < 0 || n >= 225);
                if (isOut || wallIndices.has(n)) pts += 2;
                else if (targets.includes(n)) pts += 1;
            });

            let r = Math.floor(tIdx / SIZE), c = tIdx % SIZE;
            pts += Math.max(c, SIZE - 1 - c); 
            pts += Math.max(r, SIZE - 1 - r); 
            
            return { tIdx, originalArrayIdx, pts };
        });

        // Sorting
        boxData.sort((a, b) => a.ptsb - b.ptsb);       // Lowest points first
        targetData.sort((a, b) => b.pts - a.pts);    // Highest points first

		//log(`<span style="color:#58a6ff">Sorted Boxes ARRAY(Low Pts): [${boxData.map(d => d.bIdx)}]</span>`);
		//log(`<span style="color:#58a6ff">Sorted Targets ARRAY(High Pts): [${targetData.map(d => d.tIdx)}]</span>`);
		log(`<span style="color:#58a6ff">boxes:${JSON.stringify(boxIndices)} targets:${JSON.stringify(targetIndices)}</span>`);
		// CRITICAL FIX: The pairing must map the original box index to the target index
		let pairing = new Array(boxes.length);
		boxData.forEach((box, i) => {
        pairing[box.originalArrayIdx] = targetData[i].originalArrayIdx;
		});

        // --- NEW LOGS FOR DEBUGGING ---
        const sortedBoxIndices = boxData.map(d => d.originalArrayIdx);
        const sortedTargetIndices = targetData.map(d => d.tIdx);
		
        
		//log(`<span style="color:#58a6ff">pairing: [${JSON.stringify(targetData)}]</span>`);
		//log(`<span style="color:#7ee787">Sorted Boxes ARRAY(Low Pts): [${sortedBoxIndices.join(',')}]</span>`);
        //log(`<span style="color:#7ee787">Sorted Targets ARRAY(High Pts): [${sortedTargetIndices.join(',')}]</span>`);

        // Pairing: Box[0] with Target[0]
        let resultPairing = new Array(boxes.length);
        boxData.forEach((box, i) => {
            resultPairing[box.originalArrayIdx] = targetData[i].originalArrayIdx;//sortedTargetIndices ?
			//resultPairing[box.originalArrayIdx] = sortedTargetIndices[i].originalArrayIdx;
        });
		//log(`<span style="color:#7ee787">pairing: [${JSON.stringify(pairing)}]</span>`);
        //log(`<span style="color:#58a6ff">SBDT Density Match: [${resultPairing.join(',')}]</span>`);
		
		
			// Define sortedBoxIndices: the order of original array positions to move
			return {
			pairing: pairing, 
			sortedBoxIndices: boxData.map(d => d.originalArrayIdx)
			};
		};

    // --- HELPER: Unified Macro-Runner ---
    // This runs a specific sequence of box-target pairs
    const runSequence = (bIdxs, pIdx, boxOrder, targetOrder) => {
        let currentB = [...bIdxs], currentP = pIdx, anims = [];
        for (let i = 0; i < targetIndices.length; i++) {
            let bToMove = boxOrder[i];
			let targetGoalIdx = targetIndices[targetOrder[i]]; // The actual grid index of the target
            let targetGoal = targetIndices[targetOrder[i]];
            let res = findMacroPath(currentB[bToMove], targetGoal, currentB, currentP, bToMove, cfg.maxSegments);
            if (res) {
                res.forEach(seg => {
                    if (seg.reach) seg.reach.forEach( 	s => { currentP = s; 
					anims.push({p:currentP, b:[...currentB], active:bToMove, target: targetGoalIdx});
					});
                    seg.segPath.forEach(s => { currentP = currentB[bToMove]; currentB[bToMove]=s; 
					anims.push({p:currentP, b:[...currentB], active:bToMove, target: targetGoalIdx});
					});
                });
            } else return null;
        }
        return targetIndices.every(t => currentB.includes(t)) ? anims : null;
    };


	// --- HELPER 1: getInfluenceMap (Moved inside to fix ReferenceError) ---
    const getInfluenceMap = (mBoxIdx, allBoxes, pIdx) => {
        const influence = new Uint8Array(225).fill(255);
        const obstacles = new Set(wallIndices);
        allBoxes.forEach(b => obstacles.add(b));
        const LURD = [-1, -SIZE, 1, SIZE];
        let queue = [{b: mBoxIdx, p: pIdx, d: 0}];
        influence[mBoxIdx] = 0;
        let head = 0;
        while(head < queue.length) {
            let curr = queue[head++];
            for (let off of LURD) {
                let pushS = curr.b - off, targetS = curr.b + off;
                if (targetS < 0 || targetS >= 225) continue;
                if (Math.abs(off) === 1 && Math.floor(targetS/SIZE) !== Math.floor(curr.b/SIZE)) continue;
                // Deadlock check
                if (isCornered(Math.floor(targetS/SIZE), targetS%SIZE) || obstacles.has(targetS)) continue;
                
                if (findPath(curr.p, pushS, allBoxes)) {
                    if (influence[targetS] > curr.d + 1) {
                        influence[targetS] = curr.d + 1;
                        queue.push({b: targetS, p: curr.b, d: curr.d + 1});
                    }
                }
            }
        }
        return influence;
    };

    // --- SubFunction: Mode4Sub (The Standard Solver Engine) ---    ${TIME_LIMIT/1000}
    const mode4Sub = (bIdxs, pIdx, sbdt) => {
	
        const boxRefIdxs = bIdxs.map((_, i) => i);
        const targetRefIdxs = targetIndices.map((_, i) => i);
		let comboCount = 0;

		// 1. TRY SBDT FIRST
		if(sbdt==true){
			// 1. Get the raw point data
            const pairingData = sbdtPairing(bIdxs, targetRefIdxs); //targetIndices
            // 2. Extract the boxes in the order they should be moved (Low Points First)
            // We use the boxData sorting from your SBDT function
            const smartBoxOrder = pairingData.sortedBoxIndices; 
            const smartTargetOrder = pairingData.pairing;
						
            //let smartResult = runSequence(bIdxs, pIdx, smartBoxOrder, smartTargetOrder);
            //if (smartResult) {
            //log(`<span style="color:#58a6ff">SBDT Pairing: BOXES[${boxOrder.join(',')}] -> TARGETS[${smartTargetOrder.join(',')}]</span>`);
            //return smartResult;
			//}
			
			// Attempt 1: SBDT Pairing (Density Match)
			log(`<i>SBDT Attempt 1: Density Match...</i>`);
			log(`<i>SBDT Box to Target Sequence: b:[${smartBoxOrder.join(',')}]  t:[${smartTargetOrder.join(',')}]</i>`);
			let res = runSequence(bIdxs, pIdx, smartBoxOrder, smartTargetOrder);
			if (res) return res;
			// Attempt 2: SBDT Box Sequence + Natural Target Mapping (The "Combo 17282" Logic)
			log("<i>SBDT Attempt 2: Natural Mapping...</i>");
			log(`<i>SBDT Box to Target Sequence: b:[${smartBoxOrder.join(',')}]  t:[${smartBoxOrder.map((_, i) => i).join(',')}]</i>`);
			let res2 = runSequence(bIdxs, pIdx, smartBoxOrder, smartBoxOrder.map((_, i) => i));
			if (res2) return res2
			log("<i>SBDT Sequence Failed. Running permutations...</i>");
        }
		
        let oPerms = generatePermutations(boxRefIdxs);
        let tPerms = generatePermutations(targetIndices.map((_, i) => i));
		const totalCombos = oPerms.length * tPerms.length;
		
        for (let op of oPerms) {
            for (let tp of tPerms) {
			comboCount++;
                if (Date.now() - startTime > TIME_LIMIT) return "TIMEOUT";
				//log(`<span style="color: #8b949e">Combo ${comboCount}/${totalCombos}: Order [${op}] | Targets [${tp}]</span>`); // Detailed Logging
				//log(`<b><span style="color: #3fb950">SOLVED! found at Combo ${comboCount}</span></b>`);
				//log(`<i>Final Timeline: ${op.join(' → ')}</i>`);
                let currentB = [...bIdxs], currentP = pIdx, anims = [], success = true;
				// We must iterate through the targets we want to fill
                for (let i = 0; i < targetIndices.length; i++) {
                    let bToMove = op[i];
                    let targetGoal = targetIndices[tp[i]];
                    
                    let res = findMacroPath(currentB[bToMove], targetGoal, currentB, currentP, bToMove, cfg.maxSegments);
                    if (res) {
                        res.forEach(seg => {
                            if (seg.reach) seg.reach.forEach(step => { 
                                currentP = step; 
								anims.push({ p: currentP, b: [...currentB], active: bToMove, target: targetGoal });
                            });
                            seg.segPath.forEach(step => { 
                                currentP = currentB[bToMove]; currentB[bToMove] = step;
                                anims.push({ p: currentP, b: [...currentB], active: bToMove, target: targetGoal });
                            });
                        });
                    } else { success = false; break; }
                }
                if (success) {
				const allTargetsCovered = targetIndices.every(t => currentB.includes(t));
				//log(`<span style="color: #8b949e">Combo ${comboCount}/${totalCombos}: Order [${op}] | Targets [${tp}]</span>`); // Detailed Logging
				log(`<b><span style="color: #3fb950">SOLVED! found at Combo ${comboCount<totalCombos?comboCount+1:comboCount}/${totalCombos}: Order Boxes [${op}] | Targets [${tp}]</span></b>`);
				//log(`<i>Final Sequence: ${op.join(' → ')}</i>`);
				if (allTargetsCovered) return anims;
				}
            }
        }
        return null;
    };

    // --- Execution Logic ---
    
    // 1. Initial Direct Solve Attempt
    let directResult = mode4Sub(boxIndices, layout.player, true);
    if (directResult === "TIMEOUT") {
        log(`<span style='color:#f85149'>Execution stopped: Time limit ${TIME_LIMIT/1000}sec exceeded.</span>`);
        return;
    }
    if (directResult) {
        log("<b><span style='color:#3fb950'>SOLVED! (Direct Path)</span></b>");
        executeAnimation(directResult, cfg.animSpeed);
        return;
    }

    if (mode < 5) { log("Blocked. Try Mode 5."); return; }

    // 2. Deep Recursive dynPDB (Handles Serial Dependencies)
    log("Direct path blocked. Starting Deep dynamic PDB Analysis...");

    const tryDeepSolve = (currentB, currentP, depth, historyAnims) => {
        if (Date.now() - startTime > TIME_LIMIT) return "TIMEOUT";
        if (depth > 2) return null;

        let localPDB = currentB.map(bIdx => {
            const neighbors = [-1, -SIZE, 1, SIZE];
            // findPath returns [] if already at goal, preventing "teleporting"
            const reachable = neighbors.some(off => findPath(currentP, bIdx + off, currentB));
            return reachable ? getInfluenceMap(bIdx, currentB, currentP) : null;
        });

        for (let bIdx = 0; bIdx < currentB.length; bIdx++) {
            if (!localPDB[bIdx]) continue;
            for (let dist = 1; dist <= 3; dist++) {
                for (let cellIdx = 0; cellIdx < 225; cellIdx++) {
                    if (localPDB[bIdx][cellIdx] === dist) {
                        let nextBoxes = [...currentB];
                        let pushDir = (cellIdx - currentB[bIdx]) / dist;
                        let pushSide = currentB[bIdx] - pushDir;
                        
                        let walkPath = findPath(currentP, pushSide, currentB);
                        if (!walkPath && currentP !== pushSide) continue;

                        let stepAnims = [], tempP = currentP;
                        if (walkPath) walkPath.forEach(s => { 
                            tempP = s; stepAnims.push({p: tempP, b: [...currentB], active: bIdx}); 
                        });
                        
                        let pushTracker = currentB[bIdx];
                        for(let i=1; i<=dist; i++) {
                            tempP = pushTracker; pushTracker += pushDir;
                            nextBoxes[bIdx] = pushTracker;
                            stepAnims.push({p: tempP, b: [...nextBoxes], active: bIdx});
                        }

                        let finalAnims = mode4Sub(nextBoxes, tempP, false);
                        if (finalAnims === "TIMEOUT") return "TIMEOUT";
                        if (finalAnims) return [...historyAnims, ...stepAnims, ...finalAnims];

                        if (depth < 2) {
                            let deepRes = tryDeepSolve(nextBoxes, tempP, depth + 1, [...historyAnims, ...stepAnims]);
                            if (deepRes) return deepRes;
                        }
                    }
                }
            }
        }
        return null;
    };

    let deepResult = tryDeepSolve(boxIndices, layout.player, 1, []);
    
    if (deepResult === "TIMEOUT") {
        log(`<span style='color:#f85149'>Execution stopped: Time limit ${TIME_LIMIT/1000}sec exceeded.</span>`);
    } else if (deepResult) {
        log("<b><span style='color:#3fb950'>SOLVED via Deep dynamic PDB!</span></b>");
        executeAnimation(deepResult, cfg.animSpeed);
    } else {
        log("<span style='color:#f85149'>Search Exhausted. No solution found within constraints.</span>");
    }
}
//
function generatePermutations(arr) {
    const res = [], a = arr.slice(); // work on a copy so original stays intact 
        function backtrack(start) { 
        if (start === a.length - 1) { res.push(a.slice()); // copy only final permutation
        return; } 
        for (let i = start; i < a.length; i++) { 
        [a[start], a[i]] = [a[i], a[start]]; // swap 
        backtrack(start + 1);
        [a[start], a[i]] = [a[i], a[start]]; // undo swap
        } }
  backtrack(0); 
  return res; 
}
//
function findPath(startIdx, goalIdx, boxesAtThatMoment) {
    if (startIdx === goalIdx) return [];
    
    const totalCells = SIZE * SIZE;
    const parent = new Int16Array(totalCells).fill(-1);
    
    // FIXED: boxesAtThatMoment is now an array of indices, not objects
    let obstacles = new Set(wallIndices);
    boxesAtThatMoment.forEach(bIdx => obstacles.add(bIdx)); 
    
    if (obstacles.has(goalIdx)) return null;

    const LURD = [-1, -SIZE, 1, SIZE];
    let queue = [startIdx];
    parent[startIdx] = startIdx; 

    let head = 0; 
    
    while (head < queue.length) {
        let currIdx = queue[head++];

        if (currIdx === goalIdx) {
            let path = [];
            let step = goalIdx;
            while (step !== startIdx) {
                path.push(step);
                step = parent[step];
            }
            return path.reverse(); 
        }

        for (let offset of LURD) {
            let nIdx = currIdx + offset;

            // Boundary & Wrap-around Check
            if (nIdx < 0 || nIdx >= totalCells) continue;
            if (Math.abs(offset) === 1 && Math.floor(nIdx / SIZE) !== Math.floor(currIdx / SIZE)) continue;

            // Check if visited or obstacle
            if (parent[nIdx] === -1 && !obstacles.has(nIdx)) {
                parent[nIdx] = currIdx; 
                queue.push(nIdx);
            }
        }
    }
    return null;
}

function findMacroPath(startBoxIdx, goalTargetIdx, allBoxesIdx, startPlayerIdx, movingIdx, maxSeg) {
    // 1. Initialize State Tracking
    // We use a large Int8Array to track visited [BoxPos][PlayerPos] states.
    // Max index is 224, so 225 * 225 = 50,625 possible states.                   
    // NOTE: THIS FUNCTION IS ONLY FOR 15x15! IN CASE OF 16x16 OR MORE WE WOULD NEED DIFFERENT APROACH.
    const visitedStates = new Int8Array(50625); 

    // Queue stores objects, but now using simple integers for positions
    let queue = [{ 
        boxIdx: startBoxIdx, 
        playerIdx: startPlayerIdx, 
        boxesState: [...allBoxesIdx], 
        segments: [] 
    }];

    let head = 0;
    const LURD = [-1, -SIZE, 1, SIZE];

    while (head < queue.length) {
        let curr = queue[head++];

        // 2. Mathematical Key for visited check: (Box * 225) + Player 
        let stateKey = (curr.boxIdx * 225) + curr.playerIdx;
        if (visitedStates[stateKey] === 1) continue;
        visitedStates[stateKey] = 1;

        // 3. Goal Check
        if (curr.boxIdx === goalTargetIdx) return curr.segments;
        if (curr.segments.length >= maxSeg) continue;

        // 4. Try pushing in 4 directions
        for (let offset of LURD) {
            let pushSideIdx = curr.boxIdx - offset;

            // Boundary check for pushSide
            if (pushSideIdx < 0 || pushSideIdx >= 225) continue;
            if (Math.abs(offset) === 1 && Math.floor(pushSideIdx/SIZE) !== Math.floor(curr.boxIdx/SIZE)) continue;

            // Can player reach the pushing side?
            let reach = findPath(curr.playerIdx, pushSideIdx, curr.boxesState);
            
            // If reach is null, check if player is already standing there
            if (!reach && curr.playerIdx !== pushSideIdx) continue;

            // 5. Try pushing the box forward as many cells as possible (Macro Move)
            for (let dist = 1; dist < SIZE; dist++) {
                let nBoxIdx = curr.boxIdx + (offset * dist);
                
                // Boundary and Obstacle Check
                if (nBoxIdx < 0 || nBoxIdx >= 225) break;
                if (Math.abs(offset) === 1 && Math.floor(nBoxIdx/SIZE) !== Math.floor(curr.boxIdx/SIZE)) break;
                if (wallIndices.has(nBoxIdx) || curr.boxesState.some((bIdx, k) => k !== movingIdx && bIdx === nBoxIdx)) break;

                // New State calculation
                let newBoxIdx = nBoxIdx;
                let newPlayerIdx = nBoxIdx - offset; // Player ends up behind the box
                let nBoxesState = curr.boxesState.map((bIdx, k) => k === movingIdx ? newBoxIdx : bIdx);
                
                // Construct Segment Path for animation
                let sPath = [];
                for (let i = 1; i <= dist; i++) sPath.push(curr.boxIdx + offset * i);

                queue.push({
                    boxIdx: newBoxIdx,
                    playerIdx: newPlayerIdx,
                    boxesState: nBoxesState,
                    segments: [...curr.segments, { reach, segPath: sPath }]
                });
            }
        }
    }
    return null;
}

async function executeAnimation(queue, speed) {
    // The higher the speed value in config, the lower the delay
    const delay = Math.max(10, 500 - speed); 
    for (let frame of queue) {
        // frame.p and frame.b are now single integers and flat arrays
        renderEntities(frame.p, frame.b, frame.active, frame.target);
        // Wait for the next frame
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    log("<span style='color: #3fb950'>Animation Complete.</span>");
}

    function drawBoard() {
        for(let i=0; i<225; i++) {
            let el = document.getElementById(`idx${i}`);
            el.className = 'cell' + (wallIndices.has(i) ? ' wall' : '') + (targetIndices.includes(i) ? ' target' : '');
        }
    }

function renderEntities(pIdx, boxesIdxs, activeBoxIdx, activeTargetIdx) {
    // 1. Clear previous dynamic states
    document.querySelectorAll('.player, .box, .box-on-target, .active-box, .active-target').forEach(e => { 
        e.classList.remove('player', 'box', 'box-on-target', 'active-box', 'active-target'); 
        e.innerText = ''; 
    });

    // 2. Render Targets (static base layer)
    // We re-apply target styling because we cleared it above, 
    // or you can modify the selector in step 1 to avoid clearing base '.target' classes.
    targetIndices.forEach(tIdx => {
        const el = document.getElementById(`idx${tIdx}`);
        if (el) el.classList.add('target');
    });

    // 3. Highlight the specific target the AI is currently aiming for
    if (activeTargetIdx !== undefined && activeTargetIdx !== null) {
        const targetEl = document.getElementById(`idx${activeTargetIdx}`);
        if (targetEl) targetEl.classList.add('active-target');
    }

    // 4. Render Boxes
    boxesIdxs.forEach((bIdx, idx) => {
        const el = document.getElementById(`idx${bIdx}`);
        if (!el) return;

        const isOnTarget = targetIndices.includes(bIdx);
        el.classList.add(isOnTarget ? 'box-on-target' : 'box');
        
        if (idx === activeBoxIdx) {
            el.classList.add('active-box');
        }
        
        el.innerText = '📦';
    });

    // 5. Render Player
    const pEl = document.getElementById(`idx${pIdx}`);
    if (pEl) {
        pEl.classList.add('player');
        pEl.innerText = '👤';
    }
}
//
function LoadSaveMode(CaseLSM){
const systemLayouts = [{
  "nBoxes": 6,
  "nWalls": 24,
  "msg": "THE FOLLOWING LINES ARE CONSIDERED Advanced settings, SO PLEASE DO NOT EDIT THEM, UNLESS YOU KNOW WHAT YOU ARE DOING",
  "animSpeed": 340, 		 "maxSegments": 10,  	"timeLimit": 15,
  "aBoxes": [    99,    100,    115,    117,    130,    132  ],
  "aTargets": [    2,    4,    17,    18,    19,    161  ],
  "aWalls": [    0,    3,    5,    14,    43,    54,    62,    67,    72,    74,    79,    101,    102,    107,    111,    123,    156,    168,    169,    174,    192,    204,    205,    222  ],
  "iPlayer": 114,
  "title": "6x6tangled",
  "creator": "VK",
  "randomNumID": 1000000,
  "dateCreated": "2026-03-24T17:49:22.041Z"
},{
  "nBoxes": 4,
  "nWalls": 24,
  "msg": "THE FOLLOWING LINES ARE CONSIDERED Advanced settings, SO PLEASE DO NOT EDIT THEM, UNLESS YOU KNOW WHAT YOU ARE DOING",
  "animSpeed": 340,		  "maxSegments": 10,	  "timeLimit": 15,
  "aBoxes": [    102,    162,    177,    189  ],
  "aTargets": [    46,    89,    114,    164  ],
  "aWalls": [    5,    27,    37,    40,    44,    64,    70,    91,    99,    101,    106,    107,    118,    133,    139,    141,    143,    148,    150,    163,    194,    195,    203,    213  ],
  "iPlayer": 57,
  "title": "4right",
  "creator": "VK",
  "randomNumID": 1000001,
  "dateCreated": "16/2/2026, 4:10:24 PM"
},{
  "nBoxes": 2,
  "nWalls": 24,
  "msg": "THE FOLLOWING LINES ARE CONSIDERED Advanced settings, SO PLEASE DO NOT EDIT THEM, UNLESS YOU KNOW WHAT YOU ARE DOING",
  "animSpeed": 340, 		 "maxSegments": 10,		  "timeLimit": 15,
  "aBoxes": [    173,    176  ],
  "aTargets": [    172,    194  ],
  "aWalls": [    120,    121,    122,    123,    124,    125,    126,    127,    128,    129,    130,    146,    147,    148,    149,    157,    159,    161,    171,    187,    189,    191,    206,    221  ],
  "iPlayer": 208,
  "title": "2withDoor",
  "creator": "VK",
  "randomNumID": 1000002,
  "dateCreated": "16/2/2026, 9:57:31 PM"
}];
if(CaseLSM.startsWith("a1")){
document.getElementById('config').value=JSON.stringify(systemLayouts[CaseLSM.slice(-2)*1]);   initGame();   $(".modal-black").css("display", "none");    return ;             }
if(CaseLSM.startsWith("a2")){const SSAI_SavedLayouts=JSON.parse(localStorage.getItem('SokoSolveAI_SL'));
document.getElementById('LSpreviewJSON').innerHTML=JSON.stringify(SSAI_SavedLayouts[CaseLSM.slice(-2)*1], null, 1); //JSON.stringify(cfg, null, 2);
$(".modal-black").css("display", "none");		document.getElementById("LoadSaveModal3").style.display="block"; 	  return ;             }
if(CaseLSM=="a3"){
document.getElementById('config').value=document.getElementById('LSpreviewJSON').innerHTML;   initGame();   $(".modal-black").css("display", "none");    return ;             }
let divs5='', bTnALL='', bTn002='00', ii=0;
let bTn001='<button id="a1s00" onclick="LoadSaveMode(this.id)" style="width:220px; text-align:left; color:cccccc"> title </button><br>';
const cococ= ['#fd5da8', '#edbd24'];
switch (CaseLSM) {
case   "Init":
for (ii = 0; ii <= systemLayouts.length-1; ii++) {
bTn002=bTn001;
bTn002=bTn002.replace('00', ii.toString().padStart(2, 0));
bTn002=bTn002.replace("title", (ii+1) + ". " +systemLayouts[ii].title+ " VK (SYS)");//nameCreator Title Creator RandomNumID
bTn002=bTn002.replace("cccccc", cococ[0]);
bTnALL=bTnALL+bTn002
}
divs5=divs5+'<div id="BtnAreaSystem">'+ bTnALL +'</div>'
bTnALL='';
document.getElementById("StageArea1System").innerHTML=divs5;
break;
case   "OpenUpdate":
document.getElementById("LoadSaveModal1").style.display="block";
if (localStorage.getItem('SokoSolveAI_SL') === null) {	return	}
const SSAI_SavedLayouts=JSON.parse(localStorage.getItem('SokoSolveAI_SL'));
if (SSAI_SavedLayouts.length == 0) {	return	}
if (SSAI_SavedLayouts.length >= 2) {document.getElementById("LoadSaveText").style.display="none"}
for (ii = 0; ii <= SSAI_SavedLayouts.length-1; ii++) { 
bTn002=bTn001;
bTn002=bTn002.replace('1', '2');
bTn002=bTn002.replace('00', ii.toString().padStart(2, 0));
bTn002=bTn002.replace("title", (ii+1) + ". " +SSAI_SavedLayouts[ii].title+" "+SSAI_SavedLayouts[ii].creator);
bTn002=bTn002.replace("cccccc", cococ[1]);
bTnALL=bTnALL+bTn002
}
divs5=divs5+'<div id="StageAreaLocalStorage">'+ bTnALL +'</div>'
bTnALL='';
document.getElementById("StageArea2LocalStorage").innerHTML=divs5
break;
case   "DeleteLocaly":
        function removeByTwoKeys(arr, key1, value1, key2, value2) {     
        const index = arr.findIndex(    obj => obj[key1] === value1 && obj[key2] === value2  ); 
        arr.splice(index, 1);   }  
const SokoSavedLayouts=JSON.parse(localStorage.getItem('SokoSolveAI_SL'));
const Layout2Del=JSON.parse(document.getElementById('LSpreviewJSON').innerHTML);
const removed = removeByTwoKeys(SokoSavedLayouts, "randomNumID", Layout2Del.randomNumID, "title", Layout2Del.title);
localStorage.setItem('SokoSolveAI_SL', JSON.stringify(SokoSavedLayouts));
$(".modal-black").css("display", "none");
log("Layout with title: "+Layout2Del.title+" and randomNumID: "+Layout2Del.randomNumID+" has been deleted from localStorage!")
break;
default: break;} //return;
}
//
function saveLocaly(case12){
    const area = document.getElementById('config');
    let ccfg = JSON.parse(area.value);
switch (case12) {
case  1:
$(".modal-black").css("display", "none");
document.getElementById("LoadSaveModal2").style.display="block";
document.getElementById("stg_title").value=ccfg.title;
document.getElementById("stg_creator").value=ccfg.creator;
document.getElementById("stg_msg").value=ccfg.msg;
break;
case  2:
if (localStorage.getItem('SokoSolveAI_SL') === null) {	localStorage.setItem('SokoSolveAI_SL', '[]')	}
const SSAI_SavedLayouts=JSON.parse(localStorage.getItem('SokoSolveAI_SL'));
ccfg.title=document.getElementById("stg_title").value;
ccfg.creator=document.getElementById("stg_creator").value;
ccfg.msg=document.getElementById("stg_msg").value;
ccfg.randomNumID=getRandomInt();
SSAI_SavedLayouts.push(ccfg);
localStorage.setItem('SokoSolveAI_SL', JSON.stringify(SSAI_SavedLayouts));
$(".modal-black").css("display", "none");
log(ccfg.randomNumID + " has been assigned to Layout with title: "+ccfg.title+" and created by: "+ccfg.creator+". It is now available via localStorage!")
break;
default: break;} //return;
}
//
function getRandomInt() {
  const minCeiled = Math.ceil(1000009);
  const maxFloored = Math.floor(9999999);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); 
// The maximum is exclusive and the minimum is inclusive
}
//
    function log(m) { const l=document.getElementById('log'); l.innerHTML += `> ${m}<br>`; l.scrollTop = l.scrollHeight; }
		$(".close-modal").on('click',function(){$(".modal-black").css("display", "none");});
	$(".modal-black").on('click',function(){
    $(".modal-black").css("display", "none");
	}).children().on('click', function (e) {
    e.stopPropagation();
	});
		
    initGame();
	LoadSaveMode("Init");


