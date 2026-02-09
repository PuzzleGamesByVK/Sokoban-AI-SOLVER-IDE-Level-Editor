<table border="0">
  <tr>
    <td width="80%" valign="top">
      <h1>Sokoban AI Solver & IDE</h1>
      <p>
        A specialized Sokoban AI Solver powered by a Breadth-First Search (BFS) engine. 
        Designed as an interactive IDE, this tool allows users to stress-test logic 
        with custom puzzles or random layouts.
      </p>
      <p>
        <b>Mobile-Friendly Design:</b> The interface is optimized for various screen sizes, 
        ensuring that the grid and solver controls remain accessible and responsive 
        on mobile devices.
      </p>
      <p>
How to Use: Level DesignRandom Gen: Use the "RANDOM GEN" mode and click "SYNC & GENERATE" to create a new board.Manual Edit: Switch to "TOGGLE WALLS" or "TOGGLE BOX/TGT" to draw directly on the grid. The JSON in the config area updates in real-time.JSON Import: You can paste a saved configuration directly into the text area and click "SYNC & GENERATE" to load it.2. Selecting a Solver ModeEdit the "solverMode" value in the configuration text area before clicking "ANALYZE & SOLVE":Mode 1 (Linear): Solves boxes in their default order to assigned targets. Fastest, but easily blocked.Mode 2 (Target Carousel): Keeps box order fixed but tries every permutation of target assignments ($N!$).Mode 3 (Box Carousel): Keeps target assignments fixed but tries every possible order of moving the boxes ($N!$).Mode 4 (Deep Search): The most powerful mode. Tries every combination of box orders AND target assignments ($N! \times N!$). Use this for "tangled" clusters.3. ExecutionClick ANALYZE & SOLVE.Watch the Log below the grid to see the AI's "thought process" as it tests different permutations.If a solution is found, the Animation will trigger automatically at the speed defined by animSpeed.
      </p>
    </td>
    <td width="20%" valign="top">
      <img src="SOKOBAN_SOLVER_GIT1.jpg" alt="Mobile Preview" style="max-width: 100%; height: auto; border-radius: 8px;">
      <p align="center"><sub><i>Responsive IDE Preview</i></sub></p>
    </td>
  </tr>
</table>
