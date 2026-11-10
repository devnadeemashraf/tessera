set windows-shell := ["powershell.exe", "-NoLogo", "-NoProfile", "-Command"]

doctor:
    node tools/task.mjs doctor

check:
    node tools/task.mjs check

fmt:
    node tools/task.mjs fmt

brief:
    node tools/task.mjs brief

map:
    node tools/task.mjs map
