def load_prompt_from_file(file_path: str) -> str:
    """
    Load a prompt from a file.

    Args:
        file_path (str): The path to the prompt file.

    Returns:
        str: The loaded prompt.
    """
    with open(file_path, 'r') as file:
        prompt = file.read()
    return prompt