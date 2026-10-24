import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('jail',Path(__file__).parents[1]/'jail-helper.py')
jail=importlib.util.module_from_spec(spec)
spec.loader.exec_module(jail)

class JailContractTests(unittest.TestCase):
    def test_code_stays_out_of_unit_arguments_and_limits_remain_bounded(self):
        source='function solve(){return "${HOME}"}'
        payload=json.dumps({'code':source,'language':'typescript','inputs':[[]]})
        command=jail.command(['start','a'*32,payload])
        self.assertNotIn(source,command)
        self.assertNotIn(payload,command)
        for option in ['MemoryMax=384M','MemorySwapMax=0','TasksMax=64','CPUQuota=75%','RuntimeMaxSec=17','KillMode=control-group']:
            self.assertIn('--property='+option,command)
        self.assertIn('--max-old-space-size=160',command)

    def test_only_validated_job_units_can_be_stopped(self):
        with self.assertRaises(ValueError):jail.command(['stop','nginx'])
        self.assertEqual(jail.command(['stop','b'*32]),['/usr/bin/systemctl','stop','jslab-jail-'+('b'*32)+'.service'])

if __name__=='__main__':unittest.main()
