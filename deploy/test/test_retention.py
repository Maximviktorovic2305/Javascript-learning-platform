import importlib.util
import os
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('admin', Path(__file__).parents[1] / 'admin.py')
admin = importlib.util.module_from_spec(spec)
spec.loader.exec_module(admin)

@unittest.skipUnless(os.name == 'posix', 'Linux production symlinks')
class RetentionTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.patch = patch.object(admin, 'APP', self.root)
        self.patch.start()
        for sha in ['a'*40, 'b'*40, 'c'*40]:
            (self.root / 'releases' / sha).mkdir(parents=True)
            runtime = self.root / 'runtime' / sha
            runtime.mkdir(parents=True)
            (runtime / 'ready').touch()
        for name, sha in [('current', 'a'*40), ('previous', 'b'*40)]:
            (self.root / name).symlink_to(self.root / 'releases' / sha)

    def tearDown(self):
        self.patch.stop()
        self.temp.cleanup()

    def test_keeps_current_and_one_rollback(self):
        with patch.object(admin.subprocess, 'check_output', return_value=''), patch.object(admin.subprocess, 'run') as run:
            admin.retain()
        self.assertEqual({p.name for p in (self.root/'runtime').iterdir()}, {'a'*40, 'b'*40})
        self.assertEqual(run.call_count, 1)
        self.assertIn(str(self.root/'releases'/('c'*40)), run.call_args.args[0])

    def test_missing_rollback_prevents_deletion(self):
        (self.root/'previous').unlink()
        with self.assertRaises(ValueError): admin.retain()
        self.assertTrue((self.root/'runtime'/('c'*40)).exists())

    def test_outside_rollback_prevents_deletion(self):
        (self.root/'previous').unlink()
        (self.root/'previous').symlink_to(self.root)
        with self.assertRaises(ValueError): admin.retain()
        self.assertTrue((self.root/'runtime'/('c'*40)).exists())

    def test_modified_source_is_preserved(self):
        with patch.object(admin.subprocess, 'check_output', return_value=' M source.ts'), patch.object(admin.subprocess, 'run') as run:
            admin.retain()
        run.assert_not_called()

if __name__ == '__main__': unittest.main()
