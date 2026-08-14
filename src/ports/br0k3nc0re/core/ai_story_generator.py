# --- Branching Story Path Memory Stub ---
class StoryPathMemory:
    """
    Tracks branching story paths and remembers user choices.
    """
    def __init__(self):
        self.choices = []  # List of (decision_point, choice_made)
        self.branches = {}  # Dict of branch_id -> list of choices

    def add_choice(self, decision_point: str, choice: str, branch_id: str = None):
        """Record a choice at a decision point."""
        self.choices.append((decision_point, choice))
        if branch_id:
            if branch_id not in self.branches:
                self.branches[branch_id] = []
            self.branches[branch_id].append((decision_point, choice))

    def get_path(self, branch_id: str = None):
        """Get the sequence of choices for a branch or the main path."""
        if branch_id and branch_id in self.branches:
            return self.branches[branch_id]
        return self.choices

    def get_history_summary(self, branch_id: str = None) -> str:
        """Get a formatted summary of the choices made so far."""
        path = self.get_path(branch_id)
        if not path:
            return ""

        summary = "Story Decisions History:\n"
        for i, (point, choice) in enumerate(path, 1):
            summary += f"{i}. At decision point '{point}': User chose '{choice}'\n"
        return summary
"""
AI Story Generator for bR0k3nC0Re - High School Edition
Provides a set of AI templates and utilities for generating interactive stories
"""

from typing import Dict, Any, List, Optional

import random
import requests
import os
import json
import logging

logger = logging.getLogger("STORY_IMAGE_GEN")

def generate_scene_image(runpod_client, scene_description: str, output_dir: str) -> Optional[str]:
    """
    Generates an image for a story scene using the RunPod API and a specified workflow.
    
    Args:
        runpod_client: An initialized RunPodFluxClient instance.
        scene_description: A textual description of the scene to visualize.
        output_dir: The directory to save the generated image in.

    Returns:
        The file path of the generated image, or None if generation failed.
    """
    if not runpod_client:
        logger.error("RunPod client is not initialized. Cannot generate image.")
        return None

    # Define the path to the ComfyUI workflow file
    # This should be a reliable path within your project structure
    workflow_file = os.path.join(os.path.dirname(__file__), '..', 'config', 'workflow_api.json')
    
    logger.info(f"Generating image for scene: '{scene_description[:100]}...'")

    try:
        with open(workflow_file, 'r') as f:
            workflow = json.load(f)

        # Inject the scene description as the prompt
        # This assumes your workflow has a node of type "CLIPTextEncode" for the positive prompt
        prompt_node_id = None
        for node_id, node in workflow.items():
            if node.get("class_type") == "CLIPTextEncode":
                # This is a simple heuristic. A more robust solution might involve
                # naming conventions or metadata in the workflow file.
                prompt_node_id = node_id
                break
        
        if not prompt_node_id:
            logger.error("Could not find a 'CLIPTextEncode' node in the workflow file to inject the prompt.")
            return None

        workflow[prompt_node_id]["inputs"]["text"] = scene_description
        
        # Use the RunPod client to generate the image
        image_data = runpod_client.generate_image(workflow)

        if image_data:
            # Create a unique filename for the image
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"scene_{timestamp}.png"
            
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)
                
            output_path = os.path.join(output_dir, filename)
            
            with open(output_path, "wb") as f:
                f.write(image_data)
                
            logger.info(f"Successfully generated and saved scene image to {output_path}")
            return output_path
        else:
            logger.error("Image generation failed. The RunPod endpoint returned no data.")
            return None

    except FileNotFoundError:
        logger.error(f"Workflow file not found at: {workflow_file}")
        return None
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON in workflow file: {workflow_file}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during image generation: {e}", exc_info=True)
        return None


# Story genre/theme templates
STORY_TEMPLATES = {
    "public_sex": {
        "prompt": "Create a story about characters having sex in a public or semi-public place, focusing on the thrill of being caught.",
        "themes": ["Exhibitionism", "Risk", "Thrill-seeking", "Public Humiliation", "Voyeurism"],
        "elements": ["A risky location", "Near-misses with being discovered", "The sound of approaching footsteps", "The thrill of the forbidden", "An unexpected audience"]
    },
    "cheating": {
        "prompt": "Create a story about a character cheating on their partner, exploring the guilt, lust, and consequences.",
        "themes": ["Infidelity", "Betrayal", "Lust", "Guilt", "Consequences"],
        "elements": ["A secret affair", "Close calls with the spouse", "Lies and deception", "The 'other' man/woman", "The inevitable discovery"]
    },
    "group_sex": {
        "prompt": "Create a story about a group sex encounter, exploring the dynamics between the participants.",
        "themes": ["Orgy", "Sharing", "Jealousy", "Experimentation", "Shifting dynamics"],
        "elements": ["An invitation to a party", "Multiple partners", "Shifting allegiances", "Unexpected connections", "The aftermath"]
    },
    "bdsm": {
        "prompt": "Create a story about a BDSM scene, exploring themes of power, control, and submission.",
        "themes": ["Dominance", "Submission", "Pain", "Pleasure", "Trust"],
        "elements": ["A dominant and a submissive", "Bondage and restraints", "Impact play", "Role-playing", "Aftercare"]
    },
    "incest": {
        "prompt": "Create a story about an incestuous relationship, exploring the taboo and forbidden nature of their love.",
        "themes": ["Taboo", "Forbidden Love", "Secrecy", "Guilt", "Family Dynamics"],
        "elements": ["A close bond between family members", "A secret relationship", "The fear of being discovered", "Stolen moments", "The consequences of their actions"]
    },
    "first_time": {
        "prompt": "Create a story about a character's first sexual experience, focusing on the awkwardness, curiosity, and discovery.",
        "themes": ["Virginity", "First Time", "Awkwardness", "Discovery", "Innocence Lost"],
        "elements": ["An eager virgin", "An experienced partner (or another virgin)", "Fumbling and mistakes", "The pain and pleasure", "The emotional aftermath"]
    },
    "corruption": {
        "prompt": "Create a story about an innocent character being seduced and corrupted by a more experienced one.",
        "themes": ["Corruption", "Seduction", "Innocence Lost", "Manipulation", "Power Dynamics"],
        "elements": ["A naive protagonist", "A manipulative seducer", "A slow and deliberate corruption", "The breaking of taboos", "The point of no return"]
    },
    "porn_shoot": {
        "prompt": "Create a story that takes place on the set of a porn shoot.",
        "themes": ["Performance", "Exhibitionism", "Professionalism", "Behind-the-scenes", "The reality of porn"],
        "elements": ["The porn stars", "The director", "The camera crew", "A scripted scene", "The unscripted moments"]
    }
}

"""
Scene visualization/image generation hooks
"""

STORY_COMPONENTS = {
    "locations": [
        "A seedy motel room", "The back alley of a nightclub", "A stranger's bedroom",
        "A public bathroom", "A secluded beach at night", "A luxurious penthouse apartment",
        "A BDSM dungeon", "A porn studio", "The back seat of a car",
        "A crowded party", "A parent's house while they're away", "A college dorm room"
    ],
    "antagonists": [
        "A jealous spouse or partner", "A blackmailing ex-lover", "A rival for a lover's affection",
        "A disapproving family member", "A sexually transmitted disease", "An unwanted pregnancy",
        "A possessive dominant", "A manipulative submissive", "A stalker",
        "The police", "A moralistic crusader", "Their own guilt and shame"
    ],
    "complications": [
        "The condom breaks", "Someone walks in on them", "A secret recording is made",
        "Feelings get involved in a casual relationship", "A safe word is ignored", "A character can't perform",
        "An STD scare", "An unexpected pregnancy", "A character gets caught cheating",
        "A character develops an obsession", "A sexual encounter turns violent", "A character's fetish gets out of control"
    ],
    "mcguffins": [
        "A sex tape", "A pair of panties", "A positive pregnancy test",
        "A sexually explicit diary", "A BDSM contract", "The keys to a private dungeon",
        "A large sum of money for a sexual act", "A one-of-a-kind fetish object", "A condom",
        "A morning-after pill", "A sexually explicit photo", "A love letter"
    ]
}

# Decision point templates for interactive storytelling
DECISION_TEMPLATES = {
    "ethical_choice": [
        "Tell your partner you cheated",
        "Keep the affair a secret",
        "Blackmail someone with a sex tape",
        "Destroy the evidence"
    ],
    "strategic_approach": [
        "Go for a quick and risky public fuck",
        "Take the time to find a safe and private place",
        "Seduce them slowly and deliberately",
        "Get them drunk or high first"
    ],
    "relationship": [
        "End the affair and go back to your partner",
        "Leave your partner for your lover",
        "Propose a threesome",
        "Ghost them both and start fresh"
    ],
    "resource_allocation": [
        "Spend your last few dollars on a condom",
        "Risk it and go bareback",
        "Pay for a prostitute",
        "Seduce someone for a free place to stay"
    ]
}

# Cyberpunk descriptive elements for more vivid storytelling
DESCRIPTIVE_ELEMENTS = {
    "technology": [
        "the glow of a phone screen on naked skin", "the buzz of a vibrator",
        "the click of a camera shutter", "the squeak of a leather restraint",
        "the squish of lube", "the slap of skin on skin",
        "the sound of a zipper being undone", "the rustle of clothes being removed"
    ],
    "environment": [
        "the smell of sex and sweat in a small room", "the cold tile of a bathroom floor",
        "the rough fabric of a car's back seat", "the soft sheets of a luxurious bed",
        "the flickering neon light from outside a window", "the sterile environment of a porn set",
        "the grimy walls of a back alley", "the anonymity of a dark nightclub"
    ],
    "atmosphere": [
        "a sense of overwhelming lust", "the constant hum of sexual tension",
        "an undercurrent of depravity and perversion", "the crushing weight of sexual expectation",
        "a whispered hope for orgasm", "paranoia from the fear of being caught",
        "the thrill of the forbidden", "the crushing anxiety of performance"
    ]
}


# --- Scene Visualization/Image Generation ---
def generate_scene_image(scene_description: str, runpod_api_key: str = None, endpoint_id: str = None, workflow_file: str = None, out_dir: str = "data/stories/") -> str:
    """
    Generate a scene image using RunPod Serverless prompt-based integration.
    Args:
        scene_description (str): Text description of the scene.
        runpod_api_key (str): RunPod API key. If None, loaded from config.
        endpoint_id (str): RunPod Endpoint ID. If None, loaded from config.
        workflow_file (str): (Unused for prompt-based workers)
        out_dir (str): Directory to save the generated image.
    Returns:
        str: Path to generated image file, or error message.
    """
    try:
        from core.runpod_api import RunPodFluxClient
        import os
        import uuid
        from datetime import datetime
        from core.config_manager import ConfigManager

        # Load config if arguments missing
        if not runpod_api_key or not endpoint_id:
            config_mgr = ConfigManager() # This loads from config/config.json
            config = config_mgr.config
            if not runpod_api_key:
                runpod_api_key = config.get("runpod_api_key")
            if not endpoint_id:
                endpoint_id = config.get("runpod_endpoint_id")
            if not workflow_file:
                workflow_file = config.get("comfyui_workflow_file")

        logger.info(
            "Story scene image request | endpoint=%s | workflow=%s | prompt=%s",
            endpoint_id,
            workflow_file,
            scene_description[:300],
        )

        if not runpod_api_key or not endpoint_id:
            return "[Error: RunPod API key or Endpoint ID not configured]"

        if not workflow_file:
            return "[Error: No ComfyUI workflow configured for story image generation]"

        workflow_path = workflow_file
        if not os.path.isabs(workflow_path):
            workflow_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), workflow_path)

        if not os.path.exists(workflow_path):
            return f"[Error: Workflow file not found: {workflow_path}]"

        # Initialize RunPod Client
        client = RunPodFluxClient(runpod_api_key, endpoint_id)

        with open(workflow_path, 'r', encoding='utf-8') as f:
            workflow_payload = json.load(f)

        # Resolve the positive prompt node by following the KSampler's 'positive' connection
        prompt_node_id = None
        for node_id, node in workflow_payload.items():
            if isinstance(node, dict) and node.get("class_type") in ("KSampler", "KSamplerAdvanced"):
                positive_conn = node.get("inputs", {}).get("positive")
                if isinstance(positive_conn, list) and positive_conn:
                    prompt_node_id = str(positive_conn[0])
                    break
        # Fallback: first CLIPTextEncode that has a "text" input
        if prompt_node_id is None:
            for node_id, node in workflow_payload.items():
                if isinstance(node, dict) and node.get("class_type") == "CLIPTextEncode" and "text" in node.get("inputs", {}):
                    prompt_node_id = node_id
                    break

        if prompt_node_id is None:
            return "[Error: Workflow does not contain a CLIPTextEncode prompt node]"

        workflow_payload[prompt_node_id]["inputs"]["text"] = scene_description
        logger.info("Story image prompt injected into workflow node %s", prompt_node_id)

        # Generate image (synchronous for this utility function)
        image_data = client.generate_image(workflow_payload)
        if not image_data:
            return "[Error: Generation failed, no data returned]"

        # Ensure output directory exists
        os.makedirs(out_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"scene_{timestamp}_{uuid.uuid4().hex[:8]}.png"
        filepath = os.path.join(out_dir, filename)
        with open(filepath, 'wb') as f:
            f.write(image_data)
        logger.info("Story image saved | path=%s | bytes=%s", filepath, len(image_data))
        return filepath
    except Exception as e:
        logger.exception("Story scene image generation failed")
        return f"[Error: {str(e)}]"


def generate_random_story_base(genre: str = None) -> Dict[str, Any]:
    """Generate random base elements for a story"""
    if not genre or genre not in STORY_TEMPLATES:
        genre = random.choice(list(STORY_TEMPLATES.keys()))
        
    template = STORY_TEMPLATES[genre]
    
    # Create base story elements
    story = {
        "genre": genre,
        "themes": random.sample(template["themes"], min(3, len(template["themes"]))),
        "core_elements": random.sample(template["elements"], min(3, len(template["elements"])))
    }
    
    # Add random components
    story["location"] = random.sample(STORY_COMPONENTS["locations"], 2)
    story["antagonist"] = random.choice(STORY_COMPONENTS["antagonists"])
    story["complication"] = random.choice(STORY_COMPONENTS["complications"])
    story["mcguffin"] = random.choice(STORY_COMPONENTS["mcguffins"])
    
    # Add descriptive elements for richness
    story["descriptive_elements"] = {
        "technology": random.choice(DESCRIPTIVE_ELEMENTS["technology"]),
        "environment": random.choice(DESCRIPTIVE_ELEMENTS["environment"]),
        "atmosphere": random.choice(DESCRIPTIVE_ELEMENTS["atmosphere"])
    }
    
    # Set up potential decision points
    story["decision_points"] = {
        "ethical": random.sample(DECISION_TEMPLATES["ethical_choice"], 2),
        "strategic": random.sample(DECISION_TEMPLATES["strategic_approach"], 2),
        "relationship": random.sample(DECISION_TEMPLATES["relationship"], 2)
    }
    
    return story


def format_story_for_ai_prompt(story_base: Dict[str, Any], interactive: bool = True) -> str:
    """
    Format story data into a prompt for the AI.
    ⚡ Bolt Optimization: Switched from repeated string concatenation to a list and join() for better performance.
    """
    # PERF: Use a list to build prompt parts and join at the end.
    prompt_parts = [f"Create a detailed, sexually explicit story in the style of {story_base['genre']}.\n\n"]
    
    # Add themes
    prompt_parts.append("Core themes: " + ", ".join(story_base['themes']) + ".\n\n")
    
    # Add key story elements
    prompt_parts.append("The story should feature: " + ", ".join(story_base["core_elements"]) + ".\n\n")
    
    # Add setting and characters
    prompt_parts.extend([
        f"Setting: The story takes place in {' and '.join(story_base['location'])}.\n",
        f"Antagonist: {story_base['antagonist']}.\n",
        f"Complication: {story_base['complication']}.\n",
        f"Central object or goal: {story_base['mcguffin']}.\n\n"
    ])
    
    # Add descriptive elements for richer storytelling
    prompt_parts.extend([
        "Include vivid descriptions using these elements:\n",
        f"- Sights and Sounds: {story_base['descriptive_elements']['technology']}\n",
        f"- Environment: {story_base['descriptive_elements']['environment']}\n",
        f"- Atmosphere: {story_base['descriptive_elements']['atmosphere']}\n\n"
    ])
    
    # Add instructions for interactive storytelling if requested
    if interactive:
        prompt_parts.extend([
            "This is an interactive story. Focus primarily on DIALOGUE and ACTION. Do NOT include excessive environmental description in the main story text.\n",
            "Create a compelling opening section that establishes the setting and characters' desires.\n",
            "End with a critical decision point where the reader must choose from 3-4 different options.\n",
            "Include some of these potential decisions in the story:\n",
            f"- Taboo choice: {' vs. '.join(story_base['decision_points']['ethical'])}\n",
            f"- Sexual approach: {' vs. '.join(story_base['decision_points']['strategic'])}\n",
            f"- Relationship decision: {' vs. '.join(story_base['decision_points']['relationship'])}\n\n",
            "CRITICAL OUTPUT FORMAT:\n",
            "1. Write the story text first.\n",
            "2. Then, provide a '[SCENE_DESCRIPTION]' block specifically for generating an image of the current scene. This should contain all the visual environmental details you omitted from the main text.\n",
            "3. Finally, provide the choices in JSON.\n\n",
            "Format the end of your response exactly like this:\n",
            "[SCENE_DESCRIPTION]A detailed visual description of the scene for an image generator[/SCENE_DESCRIPTION]\n",
            '```json\n{"choices": ["First choice", "Second choice", "Third choice"]}\n```'
        ])
    else:
        prompt_parts.append("Create a complete self-contained story with a beginning, middle, and end. Focus on dialogue and action.")
    
    return "".join(prompt_parts)


def generate_story_concept(genre: str = None, interactive: bool = True) -> Dict[str, Any]:
    """Generate a story concept and AI prompt"""
    story_base = generate_random_story_base(genre)
    ai_prompt = format_story_for_ai_prompt(story_base, interactive)
    
    return {
        "story_base": story_base,
        "ai_prompt": ai_prompt,
        "interactive": interactive
    }


def generate_story_continuation_prompt(previous_story: str, choice: str, story_memory: Optional[StoryPathMemory] = None) -> str:
    """
    Generate a prompt to continue a story based on a chosen path.
    ⚡ Bolt Optimization: Switched from repeated string concatenation to a list and join() for better performance.
    """
    # PERF: Use a list to build prompt parts and join at the end.
    prompt_parts = ["Continue this interactive, explicit story based on the reader's choice.\n\n"]
    
    # Include story history if available
    if story_memory:
        history_summary = story_memory.get_history_summary()
        if history_summary:
            prompt_parts.append(f"{history_summary}\n\n")

    # Include a summary of the previous story
    if len(previous_story) > 1500:
        # If the story is long, provide a summary and the last part
        prompt_parts.append(f"Previous story text (last segment): ...{previous_story[-1000:]}\n\n")
    else:
        prompt_parts.append(f"Previous story text: {previous_story}\n\n")
    
    prompt_parts.append(f"The reader just chose: \"{choice}\"\n\n")
    
    # Instructions for continuation
    prompt_parts.extend([
        "Write the next segment of the story based on this choice. Focus primarily on DIALOGUE and ACTION. Do NOT include excessive environmental description in the main story text.\n",
        "Develop the narrative in an interesting way that honors the reader's decision and past history.\n",
        "Create meaningful consequences for their choice. Introduce new twists.\n",
        "End this segment with another critical decision point where the reader must choose from 3-4 different options.\n\n",
        "IMPORTANT: When generating the [SCENE_DESCRIPTION], ensure it matches the same overall artistic theme, setting, and exact character appearances as previous scenes to maintain visual consistency.\n\n"
    ])
    
    # Add some randomized guidance for the continuation to ensure variety
    guidance_options = [
        "Escalate the drama with a new conflict or taboo.",
        "Reveal something unexpected about a character's history.",
        "Change the setting to a new location.",
        "Introduce a surprising new character.",
        "Reveal that a character's motivation is not what it seems.",
        "Present a moral dilemma related to consent or betrayal.",
        "Force a difficult choice between two characters.",
        "Show an unexpected consequence of a character's actions."
    ]
    
    prompt_parts.append("Consider incorporating one of these elements:\n")
    for _ in range(3):
        prompt_parts.append(f"- {random.choice(guidance_options)}\n")
    
    prompt_parts.extend([
        "\nCRITICAL OUTPUT FORMAT:\n",
        "1. Write the story text first.\n",
        "2. Then, provide a '[SCENE_DESCRIPTION]' block specifically for generating an image of the current scene.\n",
        "3. Finally, provide the choices in JSON.\n\n",
        "Format the end of your response exactly like this:\n",
        "[SCENE_DESCRIPTION]A detailed visual description of the scene for an image generator[/SCENE_DESCRIPTION]\n",
        '```json\n{"choices": ["First choice", "Second choice", "Third choice"]}\n```'
    ])
    
    return "".join(prompt_parts)


def generate_themed_story_prompt(theme: str, character_data: Dict[str, Any] = None) -> str:
    """Generate a story prompt based on a specific theme, optionally featuring a specific character"""
    
    theme_prompts = {
        "public_adventure": "Create a fun public sex adventure full of mischief and close calls",
        "cheating_mystery": "Create a compelling cheating mystery with secrets and lies",
        "orgy_story": "Create a story about a character's first orgy and self-discovery",
        "bdsm_horror": "Create a BDSM horror story with a spooky twist",
        "incest_drama": "Create a story about an epic incestuous drama between family members",
        "corruption_story": "Create a mind-bending story exploring the pressures of sexual corruption",
        "finding_fetish": "Create a philosophical story exploring the search for one's true fetish",
        "porn_romance": "Create a classic romance story in a porn studio setting"
    }
    
    prompt = theme_prompts.get(theme, "Create an engaging explicit story")
    
    if character_data:
        char_name = character_data.get("name", "the protagonist")
        char_desc = character_data.get("description", "").split(".")[0]
        prompt += f" featuring {char_name}, who is {char_desc}."
        prompt += f"\n\nIncorporate these sexual elements of {char_name}'s character:"
        
        if "personality" in character_data:
            personality = character_data.get("personality", "").split(".")[:2]
            prompt += f"\n- Personality: {'. '.join(personality)}."
            
        if "skills" in character_data:
            skills = ", ".join(character_data.get("skills", [])[:3])
            prompt += f"\n- Key skills: {skills}."
            
        if "background" in character_data and isinstance(character_data["background"], str):
            background = character_data.get("background", "").split(".")[:1]
            prompt += f"\n- Sexual History: {'. '.join(background)}."
    
    prompt += "\n\nThis is an interactive story. Focus on dialogue and action. End with a critical decision point where the reader must choose from 3-4 different options.\n"
    prompt += "Format the end of your response exactly like this:\n"
    prompt += "[SCENE_DESCRIPTION]A detailed visual description of the scene for an image generator[/SCENE_DESCRIPTION]\n"
    prompt += '```json\n{"choices": ["First choice", "Second choice", "Third choice"]}\n```'
    
    return prompt