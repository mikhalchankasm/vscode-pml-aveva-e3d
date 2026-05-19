import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from extract_help_corpus import iter_syntax_keyword_candidates, parse_syntax_keyword_token


class SyntaxKeywordCandidateTests(unittest.TestCase):
    def test_parse_syntax_keyword_token_uses_uppercase_prefix_as_minimum(self):
        self.assertEqual(
            parse_syntax_keyword_token("DEFault"),
            {
                "token": "DEFault",
                "keyword": "DEFAULT",
                "minimum": "DEF",
                "canAbbreviate": True,
            },
        )
        self.assertEqual(
            parse_syntax_keyword_token("DELETE"),
            {
                "token": "DELETE",
                "keyword": "DELETE",
                "minimum": "DELETE",
                "canAbbreviate": False,
            },
        )
        self.assertIsNone(parse_syntax_keyword_token("Default"))

    def test_iter_syntax_keyword_candidates_deduplicates_per_section(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            chunks_path = Path(temp_dir) / "chunks.jsonl"
            chunks = [
                {
                    "id": "chunk-1",
                    "sectionId": "section-a",
                    "startPage": 621,
                    "endPage": 621,
                    "text": "DEFault\nDEFault\nPML\n|--- DELETE ---|\n",
                },
                {
                    "id": "chunk-2",
                    "sectionId": "section-b",
                    "startPage": 622,
                    "endPage": 622,
                    "text": "DEFault\n",
                },
            ]
            chunks_path.write_text(
                "".join(json.dumps(chunk) + "\n" for chunk in chunks),
                encoding="utf-8",
            )

            candidates = list(iter_syntax_keyword_candidates(chunks_path))

        self.assertEqual(
            [(candidate["sectionId"], candidate["keyword"], candidate["minimum"]) for candidate in candidates],
            [
                ("section-a", "DEFAULT", "DEF"),
                ("section-a", "DELETE", "DELETE"),
                ("section-b", "DEFAULT", "DEF"),
            ],
        )


if __name__ == "__main__":
    unittest.main()
