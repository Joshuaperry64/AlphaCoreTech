"""Unit tests for scripts/vgate.py pure logic. Run: python3 scripts/test_guard.py"""
import base64
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))
import vgate as guard  # noqa: E402


class GuardTests(unittest.TestCase):
    def test_blocks_minor_terms(self):
        for bad in ["a teen girl", "schoolgirl uniform", "17 year old", "she is 16yo", "young looking woman",
                    "petite childlike body", "loli", "high school student", "her daughter"]:
            with self.assertRaises(guard.GateError, msg=bad):
                guard.gate_text(bad)

    def test_blocks_likeness(self):
        for bad in ["deepfake of her", "celebrity face swap", "looks like my coworker", "follow @someuser",
                    "photo of my ex", "non-consensual scene"]:
            with self.assertRaises(guard.GateError, msg=bad):
                guard.gate_text(bad)

    def test_allows_adult_prompt_and_anchors(self):
        p, n = guard.gate_text("woman in her thirties, candlelit bedroom", "blurry")
        self.assertTrue(p.startswith(guard.BASE_ANCHOR))
        self.assertIn("child", n)
        self.assertIn("blurry", n)

    def test_forced_negative_cannot_be_dropped(self):
        _, n = guard.gate_text("mature woman", "")
        self.assertTrue(n.startswith(guard.BASE_NEG))

    def test_lora_names(self):
        self.assertEqual(guard.gate_tags("none"), "none")
        self.assertEqual(guard.gate_tags("Cowgirl,Missionary"), "Cowgirl,Missionary")
        for bad in ["younger", "petite", "youthful_faceV1", "schoolgirl_uniform", "cunny"]:
            with self.assertRaises(guard.GateError, msg=bad):
                guard.gate_tags(bad)

    def test_character_age(self):
        self.assertEqual(guard.vet_age(30), 30)
        for bad in [17, 12, "x", None]:
            with self.assertRaises(guard.GateError):
                guard.vet_age(bad)

    def test_trim_params_strips_likeness_inputs(self):
        out = guard.trim_params({"prompt": "x", "ip_adapter_image_b64": "AAA", "control_image_b64": "B", "seed": 1})
        self.assertEqual(out, {"prompt": "x", "seed": 1})

    def test_image_tokens(self):
        b64 = base64.b64encode(b"fake-png-bytes").decode()
        tok = guard.seal_img(b64, "secret")
        self.assertTrue(guard.verify_seal(b64, tok, "secret"))
        self.assertFalse(guard.verify_seal(b64, tok, "other"))
        other = base64.b64encode(b"different").decode()
        self.assertFalse(guard.verify_seal(other, tok, "secret"))
        self.assertFalse(guard.verify_seal(b64, "", "secret"))


if __name__ == "__main__":
    unittest.main()
