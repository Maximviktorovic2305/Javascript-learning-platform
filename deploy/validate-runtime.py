#!/usr/bin/env python3
"""Validate the CI runtime archive before extracting into a release worktree."""
import posixpath
import re
import sys
import tarfile


def allowed(name):
    return name == 'deploy-sha.txt' or any(
        name == prefix or name.startswith(prefix + '/')
        for prefix in ['frontend/.output', 'backend/dist']
    )


def validate(archive, sha):
    if not re.fullmatch('[0-9a-f]{40}', sha):
        raise ValueError('Invalid commit')
    with tarfile.open(archive, 'r:gz') as package:
        members = package.getmembers()
        if len(members) > 30000 or sum(item.size for item in members) > 1024**3:
            raise ValueError('Runtime archive too large')
        for item in members:
            name = item.name.rstrip('/')
            if name.startswith('/') or '..' in name.split('/') or not allowed(name):
                raise ValueError('Unexpected runtime path')
            if item.issym():
                target = posixpath.normpath(posixpath.join(posixpath.dirname(name), item.linkname))
                if item.linkname.startswith('/') or not allowed(target):
                    raise ValueError('Unsafe runtime symlink')
            elif not (item.isfile() or item.isdir()):
                raise ValueError('Unsupported runtime entry')
        manifest = package.extractfile('deploy-sha.txt')
        if manifest is None or manifest.read(100).strip() != sha.encode('ascii'):
            raise ValueError('Runtime belongs to a different commit')


if __name__ == '__main__':
    validate(*sys.argv[1:])
