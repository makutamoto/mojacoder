#!/usr/bin/env python3

import argparse
import shlex
import tomllib
from pathlib import Path


def dependency_version(name: str, specification: object) -> tuple[str, str]:
    package_name = name
    if isinstance(specification, str):
        version = specification
    elif isinstance(specification, dict):
        version = specification.get("version")
        package_name = specification.get("package", name)
    else:
        version = None

    if not isinstance(version, str) or not version.startswith("="):
        raise ValueError(f"dependency {name!r} must use an exact version")
    return package_name, version[1:].strip()


def find_library(deps_path: Path, package_name: str, version: str) -> tuple[str, Path]:
    source_marker = f"/{package_name}-{version}/"
    for dependency_file in sorted(deps_path.glob("*.d")):
        if source_marker not in dependency_file.read_text():
            continue
        crate_name, separator, _ = dependency_file.stem.rpartition("-")
        if not separator:
            continue
        library_stem = deps_path / f"lib{dependency_file.stem}"
        for extension in (".so", ".rlib"):
            library = library_stem.with_suffix(extension)
            if library.exists():
                return crate_name, library.resolve()
    raise FileNotFoundError(
        f"prebuilt library for {package_name} {version} was not found in {deps_path}"
    )


def generate_options(manifest_path: Path) -> list[str]:
    manifest_path = manifest_path.resolve()
    with manifest_path.open("rb") as manifest_file:
        manifest = tomllib.load(manifest_file)

    deps_path = manifest_path.parent / "target" / "release" / "deps"
    options: list[str] = []
    for dependency_name, specification in manifest.get("dependencies", {}).items():
        package_name, version = dependency_version(dependency_name, specification)
        crate_name, library = find_library(deps_path, package_name, version)
        options.extend(("--extern", f"{crate_name}={library}"))

    options.extend(("-L", f"dependency={deps_path.resolve()}"))
    return options


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate rustc options for Cargo dependencies built into the judge image."
    )
    parser.add_argument("--manifest-path", required=True, type=Path)
    args = parser.parse_args()
    print(" ".join(shlex.quote(option) for option in generate_options(args.manifest_path)))


if __name__ == "__main__":
    main()
