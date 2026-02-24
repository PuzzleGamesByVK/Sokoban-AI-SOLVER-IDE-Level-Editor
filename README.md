<table border="0">
  <tr>
    <td width="65%" valign="top">
      <h4>Sokoban AI Solver & IDE</h4>
      <p><b>🚀</b> <a href="https://puzzlegamesbyvk.github.io/Sokoban-AI-SOLVER-IDE-Level-Editor/">Live Interaction Available</a></p>
      <p>
        A specialized Sokoban AI Solver powered by a custom Breadth-First Search (BFS) engine. 
        Designed as an interactive IDE, this tool allows users to stress-test logic 
        using custom puzzles or procedural random layouts.
      </p>
      <p>
        <b>📱 Mobile-Friendly Design:</b> The interface is optimized for all screen sizes, 
        ensuring that the grid and solver controls remain accessible and responsive 
        on mobile devices.
      </p>
      <hr>
      <h5>How to Use</h5>
      <p>
        <b>Level Design:</b> Use the <b>RANDOM GEN</b> mode and click <b>SYNC & GENERATE</b> to create a new board. Switch to <b>TOGGLE WALLS</b> or <b>TOGGLE BOX/TGT</b> to draw directly on the grid. The JSON configuration updates in real-time.
      </p>
      <p>
        <b>Evolution of the Solver:</b> While previous versions utilized basic permutation modes, 
        <b>Stable Version 1.0</b> introduces a fully automated intelligence pipeline. 
        The <code>solverMode</code> is set to <b>Mode 5</b> by default, integrating several advanced logic layers:
      </p>
      <ul>
        <li><b>SBDT (Swallow Boxes to Deep Targets):</b> A custom heuristic point system that solves "tangled" layouts. It identifies which boxes block others and prioritizes deep-target filling using <i>Density Matching</i> and <i>Natural Mapping</i>.</li>
        <li><b>Efficient Hashing:</b> The BFS utilizes a simplified, high-performance hashing method for the <i>visited</i> state variable, ensuring speed and directness even in complex paths.</li>
        <li><b>Deep dynPDB (Dynamic Pattern Database):</b> The project’s most advanced feature. When direct paths are blocked, the <code>tryDeepSolve</code> function triggers a dynamic analysis to find multi-step "parking" maneuvers and sub-goals.</li>
      </ul>
      <p>
        <b>Execution:</b> Click <b>ANALYZE & SOLVE</b>. The real-time Log tracks the AI's thought process as it evaluates permutations and heuristics. Due to the complexity of N! permutations, a default 15-second <code>TIME_LIMIT</code> is implemented to ensure performance.
      </p>
      <p><i>This project was developed in collaboration with Google Gemini.</i></p>
    </td>
    <td width="35%" valign="top">
      <img src="sokoScreenshot.jpg" alt="Mobile Preview" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #30363d;">
      <p align="center"><sub><i>AI Sokoban BFS Solver<br>with Level Editor IDE<br>Mobile Friendly<br>Screenshot - Preview</i></sub></p>
    </td>
  </tr>
</table>
