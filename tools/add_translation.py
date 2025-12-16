from typing import Any

import argparse
from glob import glob
import json
import os

from luna_kit.loc import LOC


LOCALES = {
    "english": "en",   
    "arabic": "ar",    
    "chinese": "zh-CH",
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

def add_to_dict_deep(key: Any | list[Any] | tuple[Any, ...], value: Any, d: dict):
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

class TranslationHandler:
    loc_files: list[LOC]
    
    def __init__(
        self,
        game_folder: str,
        output_folder: str,
    ) -> None:
        self.loc_files = [
            LOC(path) for path in glob(os.path.join(game_folder, '*.loc'))
        ]

        self.output_folder = os.path.abspath(output_folder)

    def add_translation(
        self,
        game_key: str,
        dest_key: str,
    ):
        game_keys = game_key.split('|')

        dest_path = dest_key.split('.')

        for loc in self.loc_files:
            code = LOCALES[loc['DEV_ID'].lower()]

            with open(os.path.join(self.output_folder, f'{code}.json'), 'r', encoding = 'utf-8') as file:
                dest_dict = json.load(file)
            
            add_to_dict_deep(
                dest_path,
                ' | '.join([loc.translate(key.strip()).strip().title() for key in game_keys]),
                dest_dict,
            )

            with open(os.path.join(self.output_folder, f'{code}.json'), 'w', encoding = 'utf-8') as file:
                dest_dict = json.dump(dest_dict, file, indent = 2, ensure_ascii = False)
    
    def delete_key(self, key: str):
        key_path = key.split('.')

        
    
    
            

def main(
    game_folder: str,
    output_folder: str,
    game_key: str,
    dest_key: str,
    delete: bool = False,
):
    translator = TranslationHandler(
        game_folder,
        output_folder,
    )

    if delete:
        pass
    else:
        translator.add_translation(
            game_key,
            dest_key,
        )

if __name__ == "__main__":
    argparser = argparse.ArgumentParser()

    argparser.add_argument(
        '-i', '--input-key',
        dest = 'game_key',
        help = 'Game string key',
    )

    argparser.add_argument(
        '-k', '--dest-key',
        dest = 'dest_key',
        help = 'Destination string key',
        required = True,
    )

    argparser.add_argument(
        '-d', '--delete',
        dest = 'delete',
        action = 'store_true',
    )

    argparser.add_argument(
        '-g', '--game-folder',
        dest = 'game_folder',
        required = True,
        help = 'Game folder',
    )

    argparser.add_argument(
        '-o', '--output',
        dest = 'output',
        help = 'Output folder',
    )

    args = argparser.parse_args()
    

    output = args.output

    if output is None:
        relative_src_dir = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'src',
            'locales',
        )
        if os.path.isdir(relative_src_dir):
            output = relative_src_dir
        else:
            raise FileNotFoundError('Cannot find locales folder')

    main(
        args.game_folder,
        output,
        args.game_key,
        args.dest_key,
        args.delete,
    )
