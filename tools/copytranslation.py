import argparse
import os
from typing import Any, TypeVar
import json


LOCALES = {
    "english": "en",   
    "arabic": "ar",    
    "chinese": "zh",
    "french": "fr",    
    "german": "de",    
    "italian": "it",   
    "japanese": "ja",  
    "korean": "ko",
    "brazilian portuguese": "pt-BR",
    "russian": "ru",
    "spanish": "es",
    "thai": "th",
    "turkish": "tr",
}

def add_to_dict_deep(key: str | list[str] | tuple[str, ...], value: Any, d: dict):
    if not isinstance(d, dict):
        raise TypeError(f'{d} is not a dict')
    
    if isinstance(key, (list, tuple)):
        if len(key) == 0:
            raise IndexError('Key has to be at least 1 item')
        if len(key) == 1:
            key = key[0]
    
    if not isinstance(key, (list, tuple)):
        d[key] = value
        return d
    
    d.setdefault(key[0], {})

    return add_to_dict_deep(key[1:], value, d[key[0]])

T = TypeVar('T')
def get_from_dict_deep(key: str | list[str] | tuple[str, ...], d: dict, default: Any = None ) -> Any:
    if not isinstance(d, dict):
        raise TypeError(f'{d} is not a dict')
    
    if isinstance(key, (list, tuple)):
        if len(key) == 0:
            raise IndexError('Key has to be at least 1 item')
        if len(key) == 1:
            key = key[0]
    
    if not isinstance(key, (list, tuple)):
        return d.get(key, default)
    
    return get_from_dict_deep(key[1:], d.get(key[0], {}))

def copy_key(input_key: str, output_key: str, folder: str):
    input_path = input_key.split('.')
    output_path = output_key.split('.')
    for code in LOCALES.values():
        with open(os.path.join(folder, f'{code}.json'), 'r', encoding = 'utf-8') as file:
            locale = json.load(file)
        
        value = get_from_dict_deep(input_path, locale, '')
        add_to_dict_deep(output_path, value, locale)

        print(f'{code}: copying "{value}": {input_key} -> {output_key}')

        with open(os.path.join(folder, f'{code}.json'), 'w', encoding = 'utf-8') as file:
            locale = json.dump(locale, file, ensure_ascii = False, indent = 2)

if __name__ == "__main__":
    argparser = argparse.ArgumentParser()
    
    argparser.add_argument(
        'input_key',
        help = 'Input key',
    )

    argparser.add_argument(
        'output_key',
        help = 'Output key',
    )

    args = argparser.parse_args()
    
    relative_src_dir = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'src',
        'locales',
    )

    copy_key(args.input_key, args.output_key, relative_src_dir)

