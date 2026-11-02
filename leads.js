<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Leads Coordination · Student Network for Neuroscience</title>
  <meta name="robots" content="noindex" />
  <link rel="stylesheet" href="styles.css" />
  <link rel="stylesheet" href="leads.css" />
</head>
<body>
  <header class="site">
    <a class="brand" href="index.html"><span class="logo">SNN</span> Student Network for Neuroscience</a>
    <nav>
      <a href="index.html">Who We Are</a>
      <a href="members.html">Members Area</a>
      <a href="leads.html" class="lock active" title="Leads login" aria-label="Leads login"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></a>
    </nav>
  </header>

  <main class="wide">
    <div id="loading" class="panel"><p>Loading…</p></div>

    <div id="signed-out" class="panel hidden">
      <div class="lock-badge"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>
      <h2 style="margin-top:0">Leads login</h2>
      <p>This area is only for network leads. Sign in with your approved Google account.</p>
      <button id="login" class="btn primary">Sign in with Google</button>
      <p id="login-error" class="error hidden"></p>
    </div>

    <div id="denied" class="panel hidden">
      <h2 style="margin-top:0">Leads only</h2>
      <p>You're signed in as <strong id="denied-email"></strong>, which isn't on the leads list. Ask a lead to add you.</p>
      <button class="btn logout">Sign out</button>
    </div>

    <div id="setup" class="panel hidden">
      <h2 style="margin-top:0">🧠 Set up the leads area</h2>
      <p>Creates the page structure from Notion (Projects & Events, Outreach and Networking, the Task Group table, …) so you can start editing right away.</p>
      <button id="seed" class="btn primary">Create pages</button>
      <p id="seed-error" class="error hidden"></p>
    </div>

    <div id="app" class="hidden">
      <div class="userbar">
        <span>🧠 Leads area · <strong id="user-email"></strong></span>
        <button class="btn logout">Sign out</button>
      </div>
      <div class="layout">
        <aside class="sidebar" id="sidebar"></aside>
        <article id="view"></article>
      </div>
    </div>
  </main>

  <!-- If the page never finishes loading, explain why instead of showing "Loading…" forever. -->
  <script>
    setTimeout(function () {
      var box = document.getElementById("loading");
      if (!box || box.classList.contains("hidden")) return;
      var fileMode = location.protocol === "file:";
      box.innerHTML = fileMode
        ? '<h3 style="margin-top:0">Can\'t start from a double-clicked file</h3>' +
          '<p>Browsers block this page when it\'s opened as a file. In this folder run <code>python3 -m http.server 8000</code> ' +
          'and open <code>http://localhost:8000/' + location.pathname.split("/").pop() + '</code> instead.</p>'
        : '<h3 style="margin-top:0">Couldn\'t connect to Firebase</h3>' +
          '<p>Most likely <code>firebase-config.js</code> has a typo: it must start with <code>export const firebaseConfig = {</code> ' +
          'and every value needs quotes and a comma. Also check that <code>projectId</code> is right.</p>' +
          '<p>For the exact error, open the browser console (Mac: Cmd+Option+J, Windows: Ctrl+Shift+J).</p>';
    }, 10000);
  </script>

  <footer>Internal · Student Network for Neuroscience</footer>

  <script type="module" src="leads.js"></script>
</body>
</html>
