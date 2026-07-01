.PHONY: help clean-root-dry-run clean-root clean-all clean-deps

SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -ExecutionPolicy Bypass -Command

# Generated files that are safe to remove from the repository root.
GENERATED_PATHS := frontend/dist .pytest_cache .ruff_cache .mypy_cache htmlcov .coverage
DEPENDENCY_PATHS := frontend/node_modules .venv venv

# Add one-off root clutter here when needed, for example:
# make clean-root ROOT_CLUTTER="old-notes.md temp-output.json"
ROOT_CLUTTER ?=

help:
	@Write-Host "Targets:"
	@Write-Host "  make clean-root-dry-run  Show generated files that would be removed"
	@Write-Host "  make clean-root          Remove generated files and caches"
	@Write-Host "  make clean-all           Alias for clean-root"
	@Write-Host "  make clean-deps          Remove local dependency folders; reinstall before running dev"

clean-root-dry-run:
	@Write-Host "Would remove these generated paths if they exist:"
	@$$paths = "$(GENERATED_PATHS) $(ROOT_CLUTTER)" -split ' '; foreach ($$path in $$paths) { if ($$path -and (Test-Path -LiteralPath $$path)) { Write-Host "  $$path" } }
	@Write-Host "Would remove recursive cache/log files:"
	@Get-ChildItem -Path . -Include __pycache__,*.pyc,*.pyo,.DS_Store,Thumbs.db,*.log -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object { Write-Host ('  ' + $$_.FullName) }

clean-root:
	@$$paths = "$(GENERATED_PATHS) $(ROOT_CLUTTER)" -split ' '; foreach ($$path in $$paths) { if ($$path -and (Test-Path -LiteralPath $$path)) { Remove-Item -LiteralPath $$path -Recurse -Force; Write-Host "removed $$path" } }
	@Get-ChildItem -Path . -Include __pycache__,*.pyc,*.pyo,.DS_Store,Thumbs.db,*.log -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

clean-all: clean-root

clean-deps:
	@$$paths = "$(DEPENDENCY_PATHS)" -split ' '; foreach ($$path in $$paths) { if ($$path -and (Test-Path -LiteralPath $$path)) { Remove-Item -LiteralPath $$path -Recurse -Force; Write-Host "removed $$path" } }
