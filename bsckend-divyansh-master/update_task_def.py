import json

def load_json(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def update_task_definition_env(task_def, env_vars):
    # Ensure "containerDefinitions" and "environment" exist in the task definition
    if "containerDefinitions" in task_def and len(task_def["containerDefinitions"]) > 0:
        container = task_def["containerDefinitions"][0]
        if "environment" not in container:
            container["environment"] = []
        for key, value in env_vars.items():
            # Check if the key already exists in the environment and update it if so
            exists = False
            for env in container["environment"]:
                if env["name"] == key:
                    env["value"] = value
                    exists = True
                    break
            if not exists:
                container["environment"].append({"name": key, "value": value})
    return task_def

def save_json(data, file_path):
    with open(file_path, 'w') as file:
        json.dump(data, file, indent=4)

def main(env_vars_file, task_def_file, output_file):
    # Load the key-value pairs and task definition JSON
    env_vars = load_json(env_vars_file)
    task_def = load_json(task_def_file)

    # Update the task definition with environment variables
    updated_task_def = update_task_definition_env(task_def, env_vars)

    # Save the updated task definition to a new file
    save_json(updated_task_def, output_file)

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 4:
        print("Usage: python update_task_def.py <env_vars.json> <task_def.json> <output_file.json>")
        sys.exit(1)

    env_vars_file = sys.argv[1]
    task_def_file = sys.argv[2]
    output_file = sys.argv[3]

    main(env_vars_file, task_def_file, output_file)
