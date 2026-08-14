"""
AI Character Generator for bR0k3nC0Re - Adult Edition
Provides a set of AI templates and utilities for generating sexually explicit character profiles
"""

from typing import Dict, Any, List, Optional
import random
import re

# Default templates for different character archetypes
CHARACTER_TEMPLATES = {
    "succubus": {
        "prompt": "Create a succubus character, alluring, seductive, and feeding on sexual energy.",
        "traits": ["Seductive", "Charismatic", "Manipulative", "Insatiable", "Supernatural"],
        "skills": ["Seduction", "Shapeshifting", "Dream-walking", "Persuasion", "Kiss of Draining"]
    },
    "bimbo": {
        "prompt": "Create a bimbo character, sexually promiscuous, dim-witted, and obsessed with her appearance.",
        "traits": ["Ditzy", "Promiscuous", "Vain", "Submissive", "Attention-seeking"],
        "skills": ["Oral Sex", "Seduction", "Flirting", "Pole Dancing", "Makeup Artistry"]
    },
    "milf": {
        "prompt": "Create a MILF character, an older, experienced, and sexually confident woman.",
        "traits": ["Experienced", "Confident", "Nurturing", "Dominant", "Sexually Voracious"],
        "skills": ["Seduction", "Teaching", "Dominance", "Stamina", "Empathy"]

    },
    "innocent": {
        "prompt": "Create an innocent character, naive, curious, and new to sexual experiences.",
        "traits": ["Naive", "Curious", "Shy", "Innocent", "Eager to learn", "Young aged"],
        "skills": ["Blushing", "Cuteness", "Exploring", "Firsts", "Vulnerability"]
    },
    "corruptor": {
        "prompt": "Create a corruptor character who enjoys seducing and debasing the innocent.",
        "traits": ["Manipulative", "Sadistic", "Patient", "Dominant", "Without Morals"],
        "skills": ["Seduction", "Blackmail", "Mind Games", "Corruption", "Finding Weaknesses"]
    }
}

# Personality traits that can be randomly selected
PERSONALITY_TRAITS = {
    "positive": [
        "Passionate", "Affectionate", "Playful", "Confident", "Adventurous", "Uninhibited", "Sensual",
        "Charismatic", "Seductive", "Dominant", "Submissive", "Nurturing", "Experienced", "Curious",
        "Loyal", "Generous", "Spontaneous", "Enthusiastic", "Intense", "Eager to please"
    ],
    "negative": [
        "Lustful", "Insatiable", "Vain", "Jealous", "Possessive", "Manipulative", "Sadistic", "Masochistic",
        "Promiscuous", "Exhibitionist", "Voyeuristic", "Needy", "Obsessive", "Depraved", "Perverted",
        "Selfish", "Greedy", "Shameless", "Degenerate", "Volatile"
    ],
    "neutral": [
        "Kinky", "Fetishistic", "Exhibitionistic", "Voyeuristic", "Submissive", "Dominant", "Experimental",
        "Bisexual", "Pansexual", "Asexual", "Polyamorous", "Monogamous", "Swinger", "Orgiastic",
        "Hedonistic", "Nihilistic", "Primal", "Instinctual", "Animalistic"
    ]
}

# Background elements to randomize
BACKGROUND_ELEMENTS = {
    "origin": [
        "Raised in a sexually repressive cult", "Grew up in a brothel",
        "Sold into sexual slavery", "Discovered their sexuality through online porn",
        "Had a highly sexualized upbringing", "Comes from a long line of courtesans",
        "Was a porn star", "A virgin who just turned 18",
        "A bored and lonely housewife", "A college student experimenting with their sexuality",
        "A supernatural being of lust", "A genetically engineered pleasure-slave"
    ],
    "formative_event": [
        "First orgasm", "Losing their virginity",
        "Being caught masturbating", "A secret incestuous encounter",
        "Their first group sex experience", "Being sexually assaulted",
        "Discovering a particular fetish", "Making their first porn video",
        "Being publicly shamed for their sexuality", "A passionate one-night stand",
        "Falling in love with a client", "Realizing they are a sexual dominant/submissive"
    ],
    "connection": [
        "Is secretly in love with their step-sibling", "Is being blackmailed with a sex tape",
        "Is the favorite prostitute of a powerful client", "Is in a BDSM contract with a master/slave",
        "Is part of a secret swingers club", "Is cheating on their spouse",
        "Is obsessed with a porn star", "Has a secret sugar daddy/mommy",
        "Is the secret lover of a public figure", "Is in a polyamorous relationship",
        "Is stalking a former lover", "Is competing with a rival for a client's affection"
    ],
    "goal": [
        "To experience every sexual pleasure imaginable", "To become the world's most famous porn star",
        "To find their one true love", "To sexually conquer a specific person",
        "To escape their life of sexual servitude", "To build a harem of lovers",
        "To corrupt an innocent person", "To explore the depths of their own depravity",
        "To earn enough money to escape their current life", "To get revenge on an ex-lover",
        "To fulfill a specific sexual fantasy", "To lose their virginity in a spectacular way"
    ]
}

QUESTION_PRIORITY = [
    {
        "field": "name",
        "aliases": ("name",),
        "question": "What is the character's name?",
        "hint": "Focus on the character's name."
    },
    {
        "field": "age",
        "aliases": ("age",),
        "question": "How old is the character?",
        "hint": "Use a positive number greater than 0."
    },
    {
        "field": "gender",
        "aliases": ("gender",),
        "question": "What gender does the character identify as?",
        "hint": "Use the identity that best fits the character."
    },
    {
        "field": "appearance",
        "aliases": ("appearance", "description"),
        "question": "Describe the character's physical appearance. What stands out immediately?",
        "hint": "Think hair, eyes, build, clothes, and any distinctive visual details."
    },
    {
        "field": "personality",
        "aliases": ("personality", "personality_traits", "traits"),
        "question": "What are their key personality traits?",
        "hint": "Focus on temperament, attitude, and how they treat other people."
    },
    {
        "field": "background",
        "aliases": ("background", "backstory", "history"),
        "question": "What is their backstory? Where do they come from?",
        "hint": "Describe the past events that shaped who they are now."
    },
    {
        "field": "speech_style",
        "aliases": ("speech_style", "voice", "accent"),
        "question": "How do they speak?",
        "hint": "Describe tone, vocabulary, rhythm, accent, or signature phrases."
    },
    {
        "field": "likes",
        "aliases": ("likes", "interests", "hobbies"),
        "question": "What does the character genuinely enjoy?",
        "hint": "Think hobbies, cravings, comforts, and favorite things."
    },
    {
        "field": "dislikes",
        "aliases": ("dislikes", "aversions"),
        "question": "What does the character avoid or hate?",
        "hint": "List frustrations, fears, pet peeves, or hard limits."
    },
    {
        "field": "motivations",
        "aliases": ("motivations", "motivation", "goals", "goal"),
        "question": "What drives this character the most right now?",
        "hint": "Describe what they want badly enough to act on."
    },
    {
        "field": "skills",
        "aliases": ("skills", "talents", "abilities"),
        "question": "What is the character unusually good at?",
        "hint": "Focus on standout talents, training, or learned abilities."
    },
    {
        "field": "secrets",
        "aliases": ("secrets", "secret"),
        "question": "What secret does the character keep hidden?",
        "hint": "Reveal something private, risky, or emotionally loaded."
    },
]

METADATA_FIELDS = {
    "id", "created_at", "updated_at", "reference_image_path", "image_path",
    "avatar", "profile_image", "scenario", "archetype"
}


class AICharacterGenerator:
    """
    A class to handle the generation and refinement of character profiles using an AI model.
    """
    def __init__(self, ai_provider=None):
        """
        Initializes the generator.
        :param ai_provider: An instance of an AI provider (e.g., GeminiProvider).
        """
        self.ai_provider = ai_provider

    def set_ai_provider(self, provider):
        self.ai_provider = provider

    def _normalize_text(self, value: Any) -> str:
        return str(value or "").strip()

    def _has_meaningful_value(self, value: Any) -> bool:
        if value is None:
            return False
        if isinstance(value, str):
            normalized = value.strip().lower()
            return bool(normalized) and normalized not in {
                "n/a", "none", "null", "unknown", "unspecified",
                "no name specified", "no gender specified", "no description specified",
                "no personality specified", "no background specified"
            }
        if isinstance(value, (list, tuple, set)):
            return any(self._has_meaningful_value(item) for item in value)
        if isinstance(value, dict):
            return any(self._has_meaningful_value(item) for item in value.values())
        return True

    def _normalize_field_name(self, field_name: str) -> str:
        normalized = (field_name or "").strip().lower().replace(" ", "_")
        alias_map = {
            "backstory": "background",
            "history": "background",
            "description": "appearance",
            "voice": "speech_style",
            "accent": "speech_style",
            "motivation": "motivations",
            "goal": "motivations",
            "goals": "motivations",
            "interests": "likes",
            "hobbies": "likes",
            "aversions": "dislikes",
            "talents": "skills",
            "abilities": "skills",
            "secret": "secrets",
            "traits": "personality",
            "personality_traits": "personality",
        }
        return alias_map.get(normalized, normalized)

    def _extract_known_fields(self, character_profile: Dict[str, Any]) -> set[str]:
        known_fields: set[str] = set()
        for key, value in character_profile.items():
            if key in METADATA_FIELDS or not self._has_meaningful_value(value):
                continue
            normalized = self._normalize_field_name(key)
            known_fields.add(normalized)
        return known_fields

    def _field_from_question(self, question: str) -> Optional[str]:
        text = (question or "").lower()
        if "name" in text:
            return "name"
        if "how old" in text or "age" in text or "years old" in text:
            return "age"
        if "gender" in text or "identify as" in text:
            return "gender"
        if any(token in text for token in ["appearance", "look like", "looks like", "hair", "eyes", "clothes", "outfit", "physical"]):
            return "appearance"
        if any(token in text for token in ["personality", "trait", "temperament", "attitude"]):
            return "personality"
        if any(token in text for token in ["backstory", "background", "come from", "history", "past"]):
            return "background"
        if any(token in text for token in ["speak", "talk", "accent", "voice", "phrase"]):
            return "speech_style"
        if any(token in text for token in ["enjoy", "likes", "like to", "hobbies", "interests"]):
            return "likes"
        if any(token in text for token in ["hate", "avoid", "dislike", "pet peeve", "fear"]):
            return "dislikes"
        if any(token in text for token in ["drive", "goal", "motivation", "want most"]):
            return "motivations"
        if any(token in text for token in ["good at", "skill", "talent", "ability"]):
            return "skills"
        if any(token in text for token in ["secret", "hidden"]):
            return "secrets"
        return None

    def _asked_about(self, questions_and_answers: List[dict], keywords: List[str]) -> bool:
        for qa in questions_and_answers:
            text = (qa.get("question") or "").lower()
            if any(keyword in text for keyword in keywords):
                return True
        return False

    def _description_blob(self, character_profile: Dict[str, Any]) -> str:
        parts = [
            self._normalize_text(character_profile.get("description")),
            self._normalize_text(character_profile.get("appearance")),
        ]
        return " ".join(part for part in parts if part).lower()

    def _appearance_follow_up(self, character_profile: Dict[str, Any], questions_and_answers: List[dict]) -> Optional[dict]:
        description_text = self._description_blob(character_profile)

        if not self._asked_about(questions_and_answers, ["hair"]) and "hair" not in description_text:
            return {
                "question": "What kind of hair does the character have?",
                "hint": "Describe color, texture, or anything visually distinctive about the hair.",
                "field": "appearance",
            }

        hair_length_tokens = ["long hair", "short hair", "shoulder-length", "waist-length", "cropped", "bob", "braid", "ponytail", "shaved"]
        if "hair" in description_text and not any(token in description_text for token in hair_length_tokens):
            if not self._asked_about(questions_and_answers, ["long", "short", "length", "style"]):
                return {
                    "question": "Is their hair long, short, or styled in a distinctive way?",
                    "hint": "Expand the existing hair description instead of replacing it.",
                    "field": "appearance",
                }

        if not self._asked_about(questions_and_answers, ["eyes", "eye color"]) and "eyes" not in description_text:
            return {
                "question": "What are their eyes like?",
                "hint": "Think about color, intensity, and the feeling in their gaze.",
                "field": "appearance",
            }

        if not self._asked_about(questions_and_answers, ["wear", "outfit", "clothes", "dress"]) and not any(token in description_text for token in ["jacket", "coat", "dress", "shirt", "armor", "hoodie", "uniform", "outfit"]):
            return {
                "question": "What do they usually wear?",
                "hint": "Describe their usual style or signature outfit pieces.",
                "field": "appearance",
            }

        return None

    def _unique_words(self, words: List[str]) -> List[str]:
        seen = set()
        ordered = []
        for word in words:
            lowered = word.lower()
            if lowered and lowered not in seen:
                seen.add(lowered)
                ordered.append(word)
        return ordered

    def _merge_feature_phrase(self, existing: str, answer: str, feature: str) -> Optional[str]:
        def _extract_words(text: str) -> List[str]:
            tokens = re.findall(r"[A-Za-z\-]+", text)
            stop_words = {"the", "a", "an", "has", "have", "had", "with", "their", "her", "his", "she", "he", "they"}
            for index, token in enumerate(tokens):
                if token.lower() != feature.lower():
                    continue
                collected: List[str] = []
                cursor = index - 1
                while cursor >= 0 and len(collected) < 3:
                    candidate = tokens[cursor]
                    if candidate.lower() in stop_words:
                        break
                    collected.insert(0, candidate)
                    cursor -= 1
                return collected
            return []

        existing_words = _extract_words(existing)
        answer_words = _extract_words(answer)
        if not existing_words or not answer_words:
            return None

        length_words = ["long", "short", "cropped", "shoulder-length", "waist-length", "shaved"]
        texture_words = ["straight", "wavy", "curly", "coiled", "messy", "silky", "braided"]
        color_words = [
            "black", "brown", "blonde", "golden", "white", "silver", "gray", "grey",
            "red", "auburn", "pink", "blue", "green", "purple", "crimson"
        ]

        def _bucket(words: List[str], allowed: List[str]) -> List[str]:
            return [word for word in words if word.lower() in allowed]

        combined = (
            _bucket(answer_words + existing_words, length_words)
            + _bucket(answer_words + existing_words, texture_words)
            + _bucket(answer_words + existing_words, color_words)
        )

        remainder = [
            word for word in answer_words + existing_words
            if word.lower() not in length_words + texture_words + color_words
        ]
        phrase_words = self._unique_words(combined + remainder)
        if not phrase_words:
            return None

        replacement = f"{' '.join(phrase_words)} {feature}"
        source_phrase = " ".join(existing_words + [feature])
        return re.sub(rf"\b{re.escape(source_phrase)}\b", replacement, existing, count=1, flags=re.IGNORECASE)

    def _merge_text_value(self, existing: Any, answer: Any) -> str:
        existing_text = self._normalize_text(existing)
        answer_text = self._normalize_text(answer)
        if not existing_text:
            return answer_text
        if not answer_text:
            return existing_text

        if answer_text.lower() in existing_text.lower():
            return existing_text
        if existing_text.lower() in answer_text.lower():
            return answer_text

        merged_hair = self._merge_feature_phrase(existing_text, answer_text, "hair")
        if merged_hair:
            return merged_hair

        merged_eyes = self._merge_feature_phrase(existing_text, answer_text, "eyes")
        if merged_eyes:
            return merged_eyes

        separator = "; " if existing_text.endswith(('.', '!', '?')) else ", "
        return f"{existing_text}{separator}{answer_text}"

    def _merge_field_value(self, character_profile: Dict[str, Any], field_name: str, answer: Any):
        field = self._normalize_field_name(field_name)
        answer_text = self._normalize_text(answer)
        if not answer_text:
            return

        if field == "age":
            age_match = re.search(r"\d+", answer_text)
            if age_match:
                age_value = int(age_match.group(0))
                if age_value > 0:
                    character_profile["age"] = age_value
            return

        if field == "appearance":
            current = character_profile.get("description") or character_profile.get("appearance")
            character_profile["description"] = self._merge_text_value(current, answer_text)
            return

        if field in {"personality", "background", "speech_style", "likes", "dislikes", "motivations", "skills", "secrets", "habits", "relationship_style", "signature_detail"}:
            character_profile[field] = self._merge_text_value(character_profile.get(field), answer_text)
            return

        character_profile[field] = self._merge_text_value(character_profile.get(field), answer_text)

    def generate_contextual_question(self, character_profile: dict, questions_and_answers: list, is_refinement: bool) -> dict:
        """
        Generates a contextual question based on the current character profile and previous Q&A.
        """
        known_fields = self._extract_known_fields(character_profile)

        for qa in questions_and_answers:
            if not self._has_meaningful_value(qa.get("answer")):
                continue
            field = self._field_from_question(qa.get("question", ""))
            if field:
                known_fields.add(field)

        for spec in QUESTION_PRIORITY:
            aliases = {self._normalize_field_name(alias) for alias in spec["aliases"]}
            if known_fields.intersection(aliases):
                continue
            return {"question": spec["question"], "hint": spec["hint"], "field": spec["field"]}

        appearance_follow_up = self._appearance_follow_up(character_profile, questions_and_answers)
        if appearance_follow_up:
            return appearance_follow_up

        follow_up_questions = [
            {
                "question": "What private habit or ritual reveals the character's real self?",
                "hint": "Think of a behavior they repeat when nobody is watching.",
                "field": "habits"
            },
            {
                "question": "What kind of relationship dynamic does this character fall into most easily?",
                "hint": "Describe the pattern they create with other people.",
                "field": "relationship_style"
            },
            {
                "question": "What detail about this character would make them feel vividly real in one scene?",
                "hint": "Pick one unforgettable quirk, object, scar, behavior, or obsession.",
                "field": "signature_detail"
            },
        ]
        question_index = len(questions_and_answers) % len(follow_up_questions)
        return follow_up_questions[question_index]

    def merge_answers_into_profile(self, character_profile: dict, questions_and_answers: list) -> dict:
        """
        Merges the collected answers into the character profile.
        This is a placeholder and would be more sophisticated with an LLM.
        """
        for qa in questions_and_answers:
            question = qa['question'].lower()
            answer = qa['answer']

            target_field = self._normalize_field_name(qa.get('field') or self._field_from_question(question) or "")

            if target_field == 'name':
                character_profile['name'] = answer
            elif target_field == 'age':
                self._merge_field_value(character_profile, target_field, answer)
            elif target_field == 'gender':
                character_profile['gender'] = answer
            elif target_field:
                self._merge_field_value(character_profile, target_field, answer)
            else:
                self._merge_field_value(character_profile, 'notes', f"{qa['question']}: {answer}")
        
        return character_profile


def generate_random_character_base(archetype: str = None) -> Dict[str, Any]:
    """Generate random base characteristics for a character"""
    if not archetype or archetype not in CHARACTER_TEMPLATES:
        archetype = random.choice(list(CHARACTER_TEMPLATES.keys()))
        
    template = CHARACTER_TEMPLATES[archetype]
    
    # Create base character
    character = {
        "traits": random.sample(template["traits"], min(3, len(template["traits"]))),
        "skills": random.sample(template["skills"], min(3, len(template["skills"])))
    }
    
    # Add some random personality traits
    num_positive = random.randint(1, 3)
    num_negative = random.randint(1, 2)
    num_neutral = random.randint(1, 2)
    
    all_traits = (
        random.sample(PERSONALITY_TRAITS["positive"], num_positive) +
        random.sample(PERSONALITY_TRAITS["negative"], num_negative) +
        random.sample(PERSONALITY_TRAITS["neutral"], num_neutral)
    )
    character["personality_traits"] = all_traits
    
    # Add background elements
    character["background"] = {
        "origin": random.choice(BACKGROUND_ELEMENTS["origin"]),
        "formative_event": random.choice(BACKGROUND_ELEMENTS["formative_event"]),
        "connection": random.choice(BACKGROUND_ELEMENTS["connection"]),
        "goal": random.choice(BACKGROUND_ELEMENTS["goal"])
    }
    
    return character


def format_character_for_ai_prompt(character_data: Dict[str, Any], refinement_mode: bool = False) -> str:
    """Format character data into a prompt for the AI for either new generation or refinement."""
    
    if refinement_mode:
        prompt = "You are in Character Refinement Mode. Based on the existing profile below, ask a targeted question to expand on a specific attribute. Your goal is to progressively build a more detailed character.\n\n"
        prompt += "Existing Profile:\n"
        for key, value in character_data.items():
            if value and key not in ['id', 'created_at', 'reference_image_path']:
                prompt += f"- {key.replace('_', ' ').title()}: {value}\n"
        
        prompt += "\nAsk one specific question to add more detail to one of the empty or brief fields (like 'likes', 'dislikes', 'motivations', or 'speech_style')."
        prompt += " Frame the question to elicit a descriptive answer."

    else:
        prompt = "You are in New Character Generation Mode. Create a complete and detailed character profile based on the initial details provided.\n\n"
        prompt += "Initial Details:\n"
        for key, value in character_data.items():
            if value and key not in ['id', 'created_at', 'reference_image_path']:
                prompt += f"- {key.replace('_', ' ').title()}: {value}\n"

        prompt += "\nFlesh out the character with the following attributes:\n"
        prompt += "- Appearance: A detailed physical description.\n"
        prompt += "- Personality Summary: Core personality traits.\n"
        prompt += "- Background Summary: A concise backstory.\n"
        prompt += "- Speech Style: How they talk, their accent, common phrases.\n"
        prompt += "- Likes: Specific interests and passions.\n"
        prompt += "- Dislikes: Things they avoid or hate.\n"
        prompt += "- Motivations: What drives them.\n\n"
        prompt += "Return the complete profile as a JSON object."

    return prompt


def generate_character_concept(archetype: str = None) -> Dict[str, Any]:
    """Generate a character concept and AI prompt"""
    character_base = generate_random_character_base(archetype)
    ai_prompt = format_character_for_ai_prompt(character_base)
    
    return {
        "character_base": character_base,
        "ai_prompt": ai_prompt
    }


def generate_character_expansion_prompt(character_data: Dict[str, Any], aspect: str = "personality") -> str:
    """Generate a prompt to expand a specific aspect of a character"""
    name = character_data.get("name", "this character")
    
    prompts = {
        "personality": f"Expand on {name}'s sexuality in more depth. What are their deepest kinks and fetishes? What are their sexual limits, or lack thereof? What turns them on more than anything? What kind of partner do they secretly crave?",
        
        "backstory": f"Create a more detailed sexual history for {name}. What were their first sexual experiences? What were the most pivotal moments in their sexual awakening? What traumas or triumphs have shaped their sexuality? How did they develop their sexual skills?",
        
        "relationships": f"Describe {name}'s key sexual relationships. Who are their past and present lovers? What is the nature of these relationships (e.g., romantic, purely physical, BDSM)? Are there any complicated or conflicted sexual connections? Who do they have the best sexual chemistry with?",
        
        "goals": f"What are {name}'s short-term and long-term sexual goals? What drives their lust? What secret fantasies do they harbor? What are they willing to do to achieve sexual gratification? What lines would they never cross, if any?",
        
        "secrets": f"What sexual secrets does {name} hide? Do they have any hidden fetishes, past encounters, or secret desires they are ashamed of? Is there a sexual act they secretly long to try?"
    }
    
    return prompts.get(aspect, prompts["personality"])