import json
import os
from glob import glob

def sync_dicts(base_dict: dict[str, str | dict], other_dict: dict[str, str | dict]):
    new_dict = {}

    for key, value in base_dict.items():
        if isinstance(value, dict):
            other_value = other_dict.get(key, {})
            if not isinstance(other_value, dict):
                other_value = {}
            
            new_dict[key] = sync_dicts(value, other_value)
        else:
            new_dict[key] = other_dict.get(key, '')
    
    return new_dict

def sync_locales(locales_folder: str):
    locale_files = glob('*.json', root_dir = locales_folder)

    if 'en.json' not in locale_files:
        raise FileNotFoundError('Cannot find source "en.json" file')
    
    with open(os.path.join(locales_folder, 'en.json'), 'r', encoding = 'utf-8') as file:
        base_locale = json.load(file)
    
    for filename in locale_files:
        if filename == 'en.json':
            continue

        print(f'syncing {filename}')

        full_path = os.path.join(locales_folder, filename)

        with open(full_path, 'r', encoding = 'utf-8') as file:
            locale = json.load(file)
        
        locale = sync_dicts(
            base_locale,
            locale,
        )

        with open(full_path, 'w', encoding = 'utf-8') as file:
            json.dump(locale, file, ensure_ascii = False, indent = 2)
        


if __name__ == "__main__":
    import argparse
    
    argparser = argparse.ArgumentParser()
    argparser.add_argument(
        '-i', '--input',
        dest = 'input',
        help = 'Input locales folder',
    )

    args = argparser.parse_args()

    input = args.input

    if input is None:
        relative_src_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'src',
            'locales',
        )
        if os.path.isdir(relative_src_dir):
            input = relative_src_dir
        else:
            raise FileNotFoundError('Cannot find locales folder')
    

    sync_locales(input)

