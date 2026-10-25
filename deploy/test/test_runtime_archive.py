import importlib.util
import io
from pathlib import Path
import tarfile
from tempfile import TemporaryDirectory
import unittest

spec = importlib.util.spec_from_file_location('runtime', Path(__file__).parents[1] / 'validate-runtime.py')
runtime = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runtime)


class RuntimeArchiveTests(unittest.TestCase):
    sha = 'a' * 40

    def package(self, entries, manifest=None):
        temporary = TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        path = Path(temporary.name) / 'runtime.tar.gz'
        with tarfile.open(path, 'w:gz') as archive:
            data = (self.sha if manifest is None else manifest).encode()
            item = tarfile.TarInfo('deploy-sha.txt')
            item.size = len(data)
            archive.addfile(item, io.BytesIO(data))
            for item in entries:
                archive.addfile(item, io.BytesIO(b'') if item.isfile() else None)
        return path

    def test_accepts_runtime_and_internal_symlinks(self):
        link = tarfile.TarInfo('frontend/.output/server/node_modules/example')
        link.type = tarfile.SYMTYPE
        link.linkname = '../chunks/example.mjs'
        runtime.validate(self.package([tarfile.TarInfo('backend/dist/main.js'), link]), self.sha)

    def test_rejects_paths_outside_runtime(self):
        for name in ['/etc/passwd', '../outside', 'frontend/.output/../../.git/config', '.git/config']:
            with self.subTest(name=name), self.assertRaises(ValueError):
                runtime.validate(self.package([tarfile.TarInfo(name)]), self.sha)

    def test_rejects_external_symlinks_and_devices(self):
        for kind, target in [(tarfile.SYMTYPE, '/etc'), (tarfile.SYMTYPE, '../../../outside'), (tarfile.CHRTYPE, '')]:
            item = tarfile.TarInfo('frontend/.output/escape')
            item.type, item.linkname = kind, target
            with self.subTest(kind=kind, target=target), self.assertRaises(ValueError):
                runtime.validate(self.package([item]), self.sha)

    def test_binds_archive_to_verified_commit(self):
        with self.assertRaises(ValueError):
            runtime.validate(self.package([], 'b' * 40), self.sha)
