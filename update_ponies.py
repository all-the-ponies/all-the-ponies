import argparse
from glob import glob
import io
import json
import os
import pathlib
import shutil
from typing import Any
from typing import Iterable, Optional, Sequence, Union
import urllib.parse
from datetime import datetime, timedelta

import charset_normalizer
import requests
from rich.progress import (
    BarColumn,
    MofNCompleteColumn,
    Progress,
    ProgressType,
    TextColumn,
    TimeRemainingColumn,
)
from rich.console import Console

from PIL import Image
from crop import crop_image

from luna_kit.gameobjectdata import GameObject, GameObjectData
from luna_kit.loc import LOC
from luna_kit.xml import parse_xml
from luna_kit.pvr import PVR
import luna_kit.typings
from luna_kit.typings.defaultGameCampaign import DefaultGameCampaignType

console = Console()

NPC_PONIES = [
    "Pony_Derpy", # derpy box, not playable muffins
    'Pony_Disguised_Spike',
    "Pony_Chest",
    'Pony_Tirek', # Not the playable tirek
    'Pony_Tirek_TOTB',
    'Pony_Windigo', # unobtainable
]

QUEST_PONIES = [
    'Pony_Quest_Duplicate_Starlight',
    'Pony_Quest_Duplicate_Discord',
    'Pony_Quest_Duplicate_Trixie',
    'Pony_Quest_Duplicate_Thorax',
    'Pony_Quest_Fluttershy_Duplicate',
    'Pony_Quest_Duplicate_Scootaloo',
    'Pony_Quest_Duplicate_Sweetiebelle',
    'Pony_Quest_Duplicate_Apple_Bloom',
    'Pony_Quest_Changeling_Runaway_01',
    'Pony_Quest_Changeling_Runaway_02',
]

UNUSED_PONIES = [
    'Pony_Twilight_Sneak_Le',
    'Pony_Camo_Dash',
    'Pony_Wingless_Rainbow_Dash',
    'Pony_Crystal_Luna_Hair_Test',
    'Pony_Token_Test',
]

WIKI_URLS = {
    'indie': 'https://mlp-game-wiki.no/index.php/',
    'fandom': 'https://mlp-gameloft.fandom.com/wiki/',
}

WIKI_PAGES = {
    'indie': {
        'page': '{name}',
        '2d_image': 'File:{name}_2d.png',
        'portrait': 'File:{name}_portrait.png',
    },
    'fandom': {
        'page': '{name}',
    }
}

LOCATIONS = {
    0: 'PONYVILLE',
    1: 'CANTERLOT',
    2: 'SWEET_APPLE_ACRES',
    3: 'EVERFREE_FOREST',
    4: 'CRYSTAL_EMPIRE',
    5: 'CHANGELING_KINGDOM',
    6: 'KLUGETOWN',
}

CURRENCY = {
    1: 'Bits',
    2: 'Gems',
}

PRIZE_TYPES = {
    'XP': 'XP',
    'Bits': 'Bits',
    'Gems': 'Gems',
    'MinecartWheel_StarMastery': 'Minecart_Wheel',
    'MinecartWheel': 'Minecart_Wheel',
    'LoyaltyShard': 'Loyalty_Shard',
    'KindnessShard': 'Kindness_Shard',
    'LaughterShard': 'Laughter_Shard',
    'GenerosityShard': 'Generosity_Shard',
    'HonestyShard': 'Honesty_Shard',
    'MagicShard': 'Magic_Shard',
    'PopCurrency1': 'Pin',
    'PopCurrency2': 'Button',
    'PopCurrency3': 'Twine',
    'PopCurrency4': 'Ribbon',
    'PopCurrency5': 'Bow',
    'Token_Lottery': 'Lucky_Coin',
    'Token_CE_Lottery': 'Crystal_Coin',
}

def strToInt(value: str):
    try:
        return int(float(value))
    except ValueError:
        return -1

def normalize_path(path: str):
    return pathlib.Path(path).as_posix()

def track(
    sequence: Union[Iterable[ProgressType], Sequence[ProgressType]],
    total: Optional[float] = None,
    description: str = 'Working...',
    transient: bool = False,
):
    progress = Progress(
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        MofNCompleteColumn(),
        TimeRemainingColumn(),
        transient = transient,
        console = console,
    )

    with progress:
        yield from progress.track(
            sequence = sequence,
            description = description,
            total = total,
        )

def check_wiki(name: str, result: Optional[dict] = None, check: bool = False):
    if not isinstance(result, dict):
        result = {}
    
    
    for wiki, wiki_url in WIKI_URLS.items():
        if not wiki_url.endswith('/') and not wiki_url.endswith('\\'):
            wiki_url += '/'
        
        wiki_result = result.setdefault(wiki, {})
        for page, url_template in WIKI_PAGES[wiki].items():
            page_result: dict = wiki_result.setdefault(page, {
                'exists': False,
                'redirect': False,
                'path': url_template.format(name = name),
            })
            if check and (not page_result.get('exists', False) or page_result.get('redirect', False)):
                page_result['path'] = url_template.format(name = name)
                url = wiki_url + page_result.get('path', url_template.format(name = name))

                if (datetime.now() - datetime.fromtimestamp(page_result.get('timestamp', 0))) < timedelta(days = 1):
                    console.print(f'skipping {url}')
                    continue
                    
                response = requests.head(url)
                if response.status_code == 301:
                    page_result['exists'] = True
                    page_result['redirect'] = True
                elif response.status_code == 200:
                    page_result['exists'] = True
                    page_result['redirect'] = False
                else:
                    page_result['exists'] = False
                    page_result['redirect'] = False
                    page_result['timestamp'] = datetime.now().timestamp()
                    console.print(f'[red]no page for [blue]{url}[/]')
        
    return result

def add_translation(key: str, pony_info: dict, loc_files: list[LOC], type: str = 'name', locked: bool = False):
    unknown_name = False
    for loc in loc_files:
        lang = loc['DEV_ID'].lower()
        if key not in loc and not unknown_name:
            print(f"No {type} for {key}")
            unknown_name = True
        if not locked or (locked and lang not in pony_info[type]):
            name = loc.translate(key).strip().replace('|', '')
            if lang in pony_info[type] and pony_info[type][lang].replace('|', '') != name:
                print(f'new: {name}')
                print(f"old: {pony_info[type][lang].replace('|', '')}")
            pony_info[type][lang] = name


def translate(
    key: str,
    loc_files: list[LOC],
    translation: dict[str, str] = ...,
    locked: bool = False,
) -> dict[str, str]:
    if translation is Ellipsis or translation is None:
        translation = {}
    for loc in loc_files:
        lang = loc['DEV_ID'].lower()

        string = loc.translate(key)

        if locked:
            string = translation.setdefault(lang, string)
        
        string = string.strip().replace('|', '')
        translation[lang] = string
    
    return translation


def get_encoding(file_path: str):
    return charset_normalizer.from_path(file_path).best().encoding


class GetGameData:
    def __init__(
        self,
        version: str,
        game_folder: str,
        output_folder: str,
        assets_folder: str,
        no_images: list[str] | None = None,
        check_wiki: bool = False,
    ) -> None:
        self.no_images = no_images

        console.print(f'get pony: {self.check_image("pony")}')
        console.print(f'get house: {self.check_image("house")}')
        console.print(f'get decor: {self.check_image("decor")}')
        console.print(f'get avatar: {self.check_image("avatar")}')
        console.print(f'get token: {self.check_image("token")}')

        self.check_wiki = check_wiki
        self.version = version
        self.game_folder = game_folder
        self.output_folder = output_folder

        self.output_game_data = os.path.join(self.output_folder,'game-data.json')
        self.images_folder = assets_folder

        self.game_data = {}

        self.get_content_version()

        console.print('loading gameobjectdata.xml')
        self.gameobjectdata = GameObjectData(
            self.get_game_file('gameobjectdata.xml', 'rb'),
            self.get_game_file('shopdata.xml', 'rb'),
            self.get_game_file('gameobjectcategorydata.xml', 'rb'),
        )

        
        console.print('Loading loc files')
        self.loc_files: list[LOC] = [
            LOC(filename) for filename in glob(os.path.join(game_folder, '*.loc'))
        ]

        self.defaultGameCampaign: DefaultGameCampaignType = json.load(self.get_game_file('defaultGameCampaign.json'))
        self.daily_goals_shop = {
            item['item_id']: item['cost']
            for item in self.defaultGameCampaign.get('mini_games', {}).get('dailygoals', {}).get('itemshop', [])
        }

        if len(self.loc_files) == 0:
            raise ValueError('Could not find loc files')

        self.migrate = 3
        with open(
            self.output_game_data,
            'r',
            encoding = get_encoding(self.output_game_data),
        ) as file:
            self.game_data = json.load(file)
        
        self.migrate = self.game_data.get('file_version', 3)
        if self.migrate == 1:
            ponies = self.game_data['ponies']
            self.game_data = {
                "file_version": 3,
                'game_version': self.version,
                'content_version': self.content_version,
                "categories": {
                    "pony": {
                        'clones': {},
                        'objects': ponies,
                    }
                }
            }
        
        if self.migrate < 3:
            moved_categories = {
                'ponies': 'pony',
                'houses': 'house',
                'shops': 'shop',
                'tokens': 'token',
                'items': 'item',
            }

            self.game_data['categories'] = {
                'pony': self.game_data['categories']['ponies'],
                'house': self.game_data['categories']['houses'],
                'shop': self.game_data['categories']['shops'],
                'decor': self.game_data['categories']['decor'],
                'item': self.game_data['categories']['items'],
                'token': self.game_data['categories']['tokens'],
            }

            for category in self.game_data['categories'].values():
                del category['name']

        self.game_data.update({
            'file_version': 3,
            'game_version': self.version,
            'content_version': self.content_version,
        })

        self.categories: dict = self.game_data.setdefault('categories', {})

        self.houses = {}

        self.get_ponies()
        self.get_houses()
        self.get_decorations()
        self.get_tokens()
        self.get_avatars()
        self.get_items()
        self.get_avatars()

        self.get_group_quests()

        for category_name, category in self.game_data['categories'].items():
            for id, object in category['objects'].items():
                object['id'] = id
                object['category'] = category_name

        console.print('saving game data')
        with open(self.output_game_data, 'w', encoding = 'utf-8') as file:
            json.dump(self.game_data, file, indent = 2, ensure_ascii = False)
        
    
    def get_game_file(
        self,
        path: str,
        mode: str = 'r',
        encoding: str | None = None,
        newline: str | None = None,
    ):
        """
        I may add opening files inside arks directly, so this'll be where I
        add that functionality without redoing everything
        """

        file_path = os.path.join(self.game_folder, path)

        with open(
            file_path,
            'rb',
        ) as file:
            if 'b' not in mode and encoding is None:
                encoding = charset_normalizer.from_fp(file).best().encoding
                file.seek(0)

            if 'b' in mode:
                result = io.BytesIO(file.read())
            else:
                result = io.StringIO(file.read().decode(encoding), newline = newline)
        
        return result

    def get_content_version(self):
        self.content_version = parse_xml(self.get_game_file('data_ver.xml', 'rb'))[0].attrib['Value']
        return self.content_version

    def save_image(self, input_path: str, output_path: str):
        image = None
        if os.path.exists(input_path + '.png'):
            image = Image.open(input_path + '.png')
        elif os.path.exists(input_path + '.pvr'):
            image = PVR(input_path + '.pvr', external_alpha = True).image
        else:
            console.print(f'could not find {os.path.basename(output_path)} image')
    
        if image is not None:
            image = crop_image(image)
            image.save(output_path)

    def check_image(self, category: str):
        return self.no_images is None or (len(self.no_images) > 0 and category not in self.no_images)

    def get_ponies(self):
        self.categories.setdefault('pony', {})
        self.categories['pony'].setdefault('clones', {})

        self.categories['pony'] = {
            'clones': self.categories['pony'].get('clones', {}),
            'objects': self.categories['pony'].get('objects', {}),
        }

        ponies = self.categories['pony']['objects']

        for hidden_pony in self.gameobjectdata['HiddenPony'].values():
            pony_id = hidden_pony.get('Parent', {}).get('PonyName')
            if pony_id and pony_id not in NPC_PONIES:
                NPC_PONIES.append(pony_id)
        

        os.makedirs(os.path.join(self.images_folder, 'game', 'pony', 'portrait'), exist_ok = True)
        os.makedirs(os.path.join(self.images_folder, 'game', 'pony', 'main'), exist_ok = True)
        
        groups = {}
        
        def test(wow = 'cool'):
            print(wow)

        index = 0
        for pony in track(
            self.gameobjectdata['Pony'].values(),
            description = 'Gathering ponies...',
        ):
            try:
                pony_info = ponies.setdefault(pony.id, {})
                if self.migrate == 1:
                    pony_info = ponies[pony.id] = {
                        'locked': pony_info.get('locked', False),
                        'index': index,
                        'note': {},
                        'name': pony_info.get('name', {}),
                        'description': pony_info.get('description', {}),
                        'alt_name': pony_info.get('alt_name', {}),
                        'tags': pony_info.get('tags', []),
                        'image': {},
                        'location': pony_info.get('location', 'UNKNOWN'),
                        'house': pony_info.get('house', ''),
                        'inns': [],
                        'changeling': pony_info.get('changeling', {}),
                        'group': [],
                        'max_level': pony_info.get('max_level', False),
                        'rewards': pony_info.get('rewards', []),
                        'minigame': {
                            'can_play_minecart': pony_info.get('minigames', {}).get('can_play_minecart', True),
                            'cooldown': pony_info.get('minigames', {}).get('minigame_cooldown', 0),
                            'skip_cost': pony_info.get('minigames', {}).get('minigame_skip_cost', 0),
                            'exp_rank': pony_info.get('exp_rank', {}).get('can_play_minecart', 0),
                        },
                        'arrival_xp': pony_info.get('arrival_xp', 0),
                        'unlock_level': pony_info.get('unlock_level', 0),
                        'cost': {},
                        'tasks': {},
                        'wiki_path': pony_info.get('wiki_path', ''),
                        'wiki': pony_info.get('wiki', {}),
                    }
                
                
                pony_info.setdefault('locked', False)
                pony_info['index'] = index
                pony_info.setdefault('note', {})

                # strings

                name = translate(
                    pony.get('Name', {}).get('Unlocal', ''),
                    self.loc_files,
                )
                if self.migrate < 3:
                    if pony_info.get('name') != name:
                        pony_info.setdefault('preferred_name', pony_info['name'])
                pony_info['name'] = name
                pony_info.setdefault('preferred_name', {})

                pony_info['description'] = translate(
                    pony.get('Description', {}).get('Unlocal', ''),
                    self.loc_files,
                )

                pony_info.setdefault('alt_name', {})
                tags = pony_info.setdefault('tags', [])
                if pony.id in UNUSED_PONIES and 'unused' not in tags:
                    tags.append('unused')
                if pony.id in NPC_PONIES and 'npc' not in tags:
                    tags.append('npc')
                if pony.id in QUEST_PONIES and 'quest' not in tags:
                    tags.append('quest')
                
                # images

                images: dict = pony_info.setdefault('image', {})

                images['portrait'] = normalize_path(os.path.join('game', 'pony', 'portrait', f'{pony.id}.png'))
                portrait_image_path = os.path.join(self.images_folder, images['portrait'])

                portrait_image_name = pony.get('Icon', {}).get('Url')
                portrait_image_source = os.path.join(self.game_folder, portrait_image_name)

                if self.check_image('pony'):
                    portrait_image = None
                    if os.path.exists(portrait_image_source + '.png'):
                        portrait_image = Image.open(portrait_image_source + '.png')
                    elif os.path.exists(portrait_image_source + '.pvr'):
                        portrait_image = PVR(portrait_image_source + '.pvr', external_alpha = True).image
                    else:
                        console.print(f'could not find {pony.id} portrait')
                
                    if portrait_image is not None:
                        portrait_image = crop_image(portrait_image)
                        portrait_image.save(portrait_image_path)
                    
                

                images['main'] = normalize_path(os.path.join('game', 'pony', 'main', f'{pony.id}.png'))
                main_image_path = os.path.relpath(os.path.join(self.images_folder, images['main']))
                if 'full' in images:
                    del images['full']

                full_image_name = os.path.splitext(pony.get('Shop', {}).get('Icon'))[0]
                full_image_source = os.path.join(self.game_folder, full_image_name)

                if self.check_image('pony'):
                    full_image = None
                    if os.path.exists(full_image_source + '.png'):
                        full_image = Image.open(full_image_source + '.png')
                    elif os.path.exists(full_image_source + '.pvr'):
                        full_image = PVR(full_image_source + '.pvr', external_alpha = True).image
                    else:
                        console.print(f'could not find {pony.id} full image')
                
                    if full_image is not None:
                        full_image = crop_image(full_image)
                        full_image.save(main_image_path)

                # more metadata
                
                pony_info['location'] = LOCATIONS.get(
                    pony.get('House', {}).get('HomeMapZone', ''),
                    'UNKNOWN',
                )
                pony_info['house'] = pony.get('House', {}).get('Type')
                self.houses.setdefault(pony_info['house'], []).append(pony.id)

                pony_info['inns'] = []
                
                
                changeling = pony.get('IsChangelingWithSet', {}).get('AltPony', None)
                if changeling:
                    pony_info['changeling'] = {
                        'id': changeling,
                        'IAmAlterSet': pony.get('IsChangelingWithSet', {}).get('IAmAlterSet', 0) == 1,
                    }
                else:
                    pony_info['changeling'] = {
                        'id': '',
                        'IAmAlterSet': False,
                    }
                
                group: list[str] = pony.get('Friends', {}).get('Friend', [])
                group = list(filter(lambda id: id != '', group))
                if len(group):
                    group.insert(0, pony.id)
                    pony_info['group_master'] = True
                
                for id in group:
                    groups[id] = group
                
                pony_info['group'] = group

                # star rewards

                pony_info['max_level'] = pony.get('AI', {}).get('Max_Level', 0) == 1


                star_rewards = []

                for prize_id, amount in zip(
                    pony.get('StarRewards', {}).get('ID', []),
                    pony.get('StarRewards', {}).get('Amount', []),
                ):
                    star_rewards.append({
                        'item': prize_id,
                        'amount': amount,
                    })
                
                pony_info['rewards'] = star_rewards

                # extra metadata
                
                minigame: dict = pony_info.setdefault('minigame', {})
                minigame['can_play_minecart'] = pony.get('Minigames', {}).get('CanPlayMineCart', 1) == 1
                minigame['cooldown'] = pony.get('Minigames', {}).get('TimeBetweenPlayActions', 0)
                minigame['skip_cost'] = pony.get('Minigames', {}).get('PlayActionSkipAgainCost', 0)
                minigame['exp_rank'] = pony.get('Minigames', {}).get('EXP_Rank', 0) # Not sure what this is, but I'll keep it

                pony_info['arrival_xp'] = pony.get('OnArrive', {}).get('EarnXP', 0)

                shopdata = self.gameobjectdata.get_object_shopdata(pony.id)
                pony_info.setdefault('unlock_level', 0)
                
                if shopdata is not None:
                    pony_info['unlock_level'] = shopdata.get('UnlockValue', 0)

                cost: dict = pony_info.setdefault('cost', {})

                cost.setdefault('base', {
                    'currency': '',
                    'amount': 0,
                })
                cost.setdefault('actual', {
                    'currency': '',
                    'amount': 0,
                })
                cost.setdefault('token', {
                    'id': '',
                    'amount': 0,
                })

                if shopdata is not None:
                    cost['base'] = {
                        'currency': CURRENCY.get(shopdata.get('CurrencyType', 0), ''),
                        'amount': shopdata.get('Cost', 0),
                    }
                    cost.setdefault('actual', cost['base'])
                    cost['token']['id'] = shopdata.get('TaskTokenID', '')
                
                cost['daily_goals'] = self.daily_goals_shop.get(pony.id, 0)

                pony_info.setdefault('tasks', {}) # will get those later

                # wiki stuff

                wiki_path = urllib.parse.quote(pony_info['name'].get('english', '').replace(' ', '_'))

                wiki_path = pony_info.setdefault('wiki_path', wiki_path)
                pony_info['wiki'] = check_wiki(
                    wiki_path,
                    pony_info.get('wiki'),
                    self.check_wiki,
                )

                ponies[pony.id] = {
                    'locked': pony_info['locked'],
                    'index': pony_info['index'],
                    'note': pony_info['note'],
                    'name': pony_info['name'],
                    'preferred_name': pony_info.get('preferred_name', {}),
                    'description': pony_info['description'],
                    'alt_name': pony_info['alt_name'],
                    'tags': pony_info['tags'],
                    'image': pony_info['image'],
                    'location': pony_info['location'],
                    'house': pony_info['house'],
                    'inns': pony_info['inns'],
                    'changeling': pony_info['changeling'],
                    'group_master': pony_info.get('group_master', False),
                    'group': pony_info['group'],
                    'group_master': pony_info.get('group_master', False),
                    'max_level': pony_info['max_level'],
                    'rewards': pony_info['rewards'],
                    'minigame': pony_info['minigame'],
                    'arrival_xp': pony_info['arrival_xp'],
                    'unlock_level': pony_info['unlock_level'],
                    'cost': pony_info['cost'],
                    'tasks': pony_info['tasks'],
                    'pro': None,
                    'collections': pony_info.get('collections', []),
                    'wiki_path': pony_info['wiki_path'],
                    'wiki': pony_info['wiki'],
                }

                index += 1
            except Exception as e:
                e.add_note(pony.id)
                raise e
        
        for pony_id, group in groups.items():
            ponies[pony_id]['group'] = group
    
    def get_houses(self):
        houses: dict = self.categories.setdefault('house', {}).setdefault('objects', {})
        shops: dict = self.categories.setdefault('shop', {}).setdefault('objects', {})

        os.makedirs(os.path.join(self.images_folder, 'game', 'house'), exist_ok = True)
        os.makedirs(os.path.join(self.images_folder, 'game', 'shop'), exist_ok = True)
        os.makedirs(os.path.join(self.images_folder, 'game', 'product'), exist_ok = True)


        index = {
            'house': 0,
            'shop': 0,
        }

        for house in track(
            self.gameobjectdata['Pony_House'].values(),
            description = 'Getting houses...',
        ):
            try:
                is_shop = bool(house.get('ShopModule', {}).get('IsAShop', 0))
                house_info: dict
                if is_shop:
                    house_info = shops.setdefault(house.id, {})
                    if house.id in self.houses:
                        console.log(f'shop is house {house.id}')
                else:
                    house_info = houses.setdefault(house.id, {})
                
                house_info.setdefault('locked', False)
                if is_shop:
                    house_info['index'] = index['shop']
                    index['shop'] += 1
                else:
                    house_info['index'] = index['house']
                    index['house'] += 1
                
                
                name = translate(
                    house.get('Name', {}).get('Unlocal', ''),
                    self.loc_files,
                )
                if self.migrate > 3:
                    if house_info.get('name') != name:
                        house_info.setdefault('preferred_name', house_info['name'])
                if house_info.get('preferred_name') == name:
                    house_info['preferred_name'] = {}
                house_info['name'] = name
                house_info.setdefault('preferred_name', {})

                house_info['image'] = {}
                house_info['image']['main'] = normalize_path(os.path.join('game', 'shop' if is_shop else 'house', f'{house.id}.png'))
                image_path = os.path.relpath(os.path.join(self.images_folder, house_info['image']['main']))

                image_name = os.path.splitext(house.get('Icon', {}).get('BookIcon'))[0]
                image_source = os.path.join(self.game_folder, image_name)
                if not os.path.isfile(image_source + '.png') and not os.path.isfile(image_source + '.pvr'):
                    image_source = os.path.join(self.game_folder, os.path.basename(image_name))
                
                if not os.path.isfile(image_source + '.png') and not os.path.isfile(image_source + '.pvr'):
                    image_name = os.path.splitext(house.get('Shop', {}).get('Icon'))[0]
                    image_source = os.path.join(self.game_folder, image_name)

                if self.check_image('house'):
                    self.save_image(image_source, image_path)
                
                shopdata = self.gameobjectdata.get_object_shopdata(house.id)
                if shopdata is None:
                    console.log(f'shopdata not found {house.id}')
                    house_info['location'] = ['UNKNOWN']
                else:
                    # house_info['location'] = shopdata.get('MapZone', -1)
                    house_info['location'] = [LOCATIONS.get(
                        strToInt(shopdata.get('MapZone', -1)),
                        'UNKNOWN',
                    )]
                
                house_info['grid_size'] = house.get('GridData', {}).get('Size', 0) // 2
                build = house_info.setdefault('build', {})
                build['time'] = house.get('Construction', {}).get('ConstructionTime', 0)
                build['skip_cost'] = house.get('Construction', {}).get('SkipCost', 0)
                build['xp'] = house.get('XP', {}).get('OnConstructionComplete', 0) + house.get('XP', {}).get('OnConstructionStarted', 0)

                visitors = [visitor for visitor in house.get('Visitors', {}).get('Ponies', []) if visitor]

                for visitor in visitors:
                    if not visitor in self.categories['pony']['objects']:
                        if visitor:
                            console.log(f'house {house.id} has nonexistent visitor "{visitor}"')
                        continue
                    
                    inns = self.categories['pony']['objects'][visitor].setdefault('inns', [])
                    if house.id not in inns:
                        inns.append(house.id)
                
                house_info['visitors'] = visitors


                house_info['residents'] = self.houses.get(house.id, [])
                if is_shop and house_info['residents']:
                    console.print(f'[red]Shop {house.id} has residents[/]')
                
                if len(house_info['residents']):
                    house_info['location'] = list({self.categories['pony']['objects'][resident]['location'] for resident in house_info['residents']})
                    console.log(f'found location {house_info["location"]}')

                if is_shop:
                    if len(house_info['location']) > 1:
                        console.log(f'Shop {house.id} has multiple locations')
                    
                    house_info['location'] = house_info['location'][0]

                    product = house_info.setdefault('product', {})
                
                    consumable = None
                
                    consumable = self.gameobjectdata['Consumable'].get(house.get('ShopModule', {}).get('Consumable_A'))
                    if consumable is not None:

                        product['name'] = translate(
                            consumable.get('Name', {}).get('Unlocal', ''),
                            self.loc_files,
                        )

                        product['image'] = normalize_path((os.path.join('game', 'product', f'{consumable.id}.png')))
                        image_path = os.path.relpath(os.path.join(self.images_folder, product['image']))

                        image_name = os.path.splitext(consumable.get('Graphic', {}).get('Sprite'))[0]
                        image_source = os.path.join(self.game_folder, image_name)

                        if self.check_image('house'):
                            self.save_image(image_source, image_path)

                        product['time'] = consumable.get('Production', {}).get('Time', 0)
                        product['skip_cost'] = consumable.get('Production', {}).get('SkipCost', 0)
                        product['xp'] = consumable.get('Consume', {}).get('XP', 0)
                        product['bits'] = consumable.get('Consume', {}).get('SoftCoins', 0)
                        product['gems'] = consumable.get('Consume', {}).get('Gems', 0)
                        product['tls'] = consumable.get('Consume', {}).get('TLS', 0)
                    
                    else:
                        console.log(f'cannot find {house.id} consumable')
                
                house_info['can_sell'] = bool(house.get('Sell', {}).get('CanSell', 0))
                
                cost = house_info.setdefault('cost', {})

                cost.setdefault('base', {
                    'currency': '',
                    'amount': 0,
                })
                cost.setdefault('actual', {
                    'currency': '',
                    'amount': 0,
                })
                cost.setdefault('token', {
                    'id': '',
                    'amount': 0,
                })

                house_info.setdefault('unlock_level', 0)

                if shopdata is not None:
                    house_info['unlock_level'] = shopdata.get('UnlockValue', 0)

                    cost['base'] = {
                        'currency': CURRENCY.get(shopdata.get('CurrencyType', 0), ''),
                        'amount': shopdata.get('Cost', 0),
                    }
                    cost.setdefault('actual', cost['base'])
                    cost['token']['id'] = shopdata.get('TaskTokenID', '')
                
                if is_shop:
                    shops[house.id] = {
                        'locked': house_info['locked'],
                        'index': house_info['index'],
                        'name': house_info['name'],
                        'preferred_name': house_info['name'],
                        'image': house_info['image'],
                        'unlock_level': house_info['unlock_level'],
                        'location': house_info['location'],
                        'grid_size': house_info['grid_size'],
                        'build': house_info['build'],
                        'visitors': house_info['visitors'],
                        'residents': house_info['residents'],
                        'product': house_info['product'],
                        'can_sell': house_info['can_sell'],
                        'cost': house_info['cost'],
                        'tags': house_info.get('tags', []),
                    }
                else:
                    houses[house.id] = {
                        'locked': house_info['locked'],
                        'index': house_info['index'],
                        'name': house_info['name'],
                        'preferred_name': house_info['name'],
                        'image': house_info['image'],
                        'location': house_info['location'],
                        'grid_size': house_info['grid_size'],
                        'build': house_info['build'],
                        'visitors': house_info['visitors'],
                        'residents': house_info['residents'],
                        'tags': house_info.get('tags', []),
                    }
            
            except Exception as e:
                e.add_note(f'house id: {house.id}')
                raise e
    
    def get_decorations(self):
        self.categories.setdefault('decor', {})
        decors = self.categories['decor'].setdefault('objects', {})

        os.makedirs(os.path.join(self.images_folder, 'game', 'decor'), exist_ok = True)
        for index, decor in track(
            enumerate(self.gameobjectdata['Decore'].values()),
            description = 'Getting decor...',
            total = len(self.gameobjectdata['Decore']),
        ):
            decor_info = decors.setdefault(decor.id, {})
            decor_info.setdefault('locked', False)
            decor_info['index'] = index

            
            decor_info['name'] = translate(
                decor.get('Name', {}).get('Unlocal', decor.id),
                self.loc_files,
            )

            decor_info['image'] = {}
            decor_info['image']['main'] = normalize_path(os.path.join('game', 'decor', f'{decor.id}.png'))
            image_path = os.path.relpath(os.path.join(self.images_folder, decor_info['image']['main']))

            image_name = os.path.splitext(decor.get('Shop', {}).get('Icon'))[0]
            image_source = os.path.join(self.game_folder, image_name)

            if self.check_image('decor'):
                self.save_image(image_source, image_path)
            
            
            shopdata = self.gameobjectdata.get_object_shopdata(decor.id)
            if shopdata is None:
                console.log(f'shopdata not found {decor.id}')
                decor_info['location'] = 'UNKNOWN'
                decor_info.setdefault('unlock_level', 0)
            else:
                # house_info['location'] = shopdata.get('MapZone', -1)
                decor_info['location'] = LOCATIONS.get(
                    strToInt(shopdata.get('MapZone', -1)),
                    'UNKNOWN',
                )
                decor_info['unlock_level'] = shopdata.get('UnlockValue', 0)
            
            decor_info['limit'] = decor.get('Shop', {}).get('PurchaseLimit', 0)
            decor_info['grid_size'] = decor.get('GridData', {}).get('Size', 0) // 2

            decor_info['xp'] = decor.get('OnPurchase', {}).get('EarnXP', 0)

            cost = decor_info.setdefault('cost', {})

            cost.setdefault('base', {
                'currency': '',
                'amount': 0,
            })
            cost.setdefault('actual', {
                'currency': '',
                'amount': 0,
            })
            cost.setdefault('token', {
                'id': '',
                'amount': 0,
            })

            if shopdata is not None:
                cost['base'] = {
                    'currency': CURRENCY.get(shopdata.get('CurrencyType', 0), ''),
                    'amount': shopdata.get('Cost', 0),
                }
                cost.setdefault('actual', cost['base'])
                cost['token']['id'] = shopdata.get('TaskTokenID', '')

            decor_info['fusion_points'] = 0
            pro = decor_info.setdefault('pro', {})
            pro['is_pro'] = bool(decor.get('ProDecoration', {}).get('IsProDecore', 0))
            pro['size'] = decor.get('ProDecoration', {}).get('GridSizeBonus', 0)
            pro['time'] = decor.get('ProDecoration', {}).get('TimeBonusPercent', 0)
            pro['bits'] = decor.get('ProDecoration', {}).get('BitsBonusPercent', 0)


        fusion_data = json.load(self.get_game_file('decoration_fusion_val.json'))
        for decor in fusion_data['DecoreList']:
            if decor['id'] not in decors:
                console.print(f'decor {decor["id"]} not found')
                continue
            decors[decor['id']]['fusion_points'] = decor['val']

    
    def get_tokens(self):
        self.categories.setdefault('token', {})
        tokens = self.categories['token'].setdefault('objects', {})

        os.makedirs(os.path.join(self.images_folder, 'game', 'token'), exist_ok = True)

        for index, token in track(
            enumerate(self.gameobjectdata['QuestSpecialItem'].values()),
            description = 'Getting tokens...',
            total = len(self.gameobjectdata['QuestSpecialItem']),
        ):
            token_info: dict = tokens.setdefault(token.id, {})
            
            token_info.setdefault('locked', False)
            token_info['index'] = index

            QuestSpecialItem = token.get('QuestSpecialItem', {})

            token_info['name'] = translate(
                QuestSpecialItem.get('Name', token.id),
                self.loc_files,
            )

            token_info['image'] = {}
            token_info['image']['main'] = normalize_path(os.path.join('game', 'token', f'{token.id}.png'))
            image_path = os.path.relpath(os.path.join(self.images_folder, token_info['image']['main']))
        
            image_name = os.path.splitext(QuestSpecialItem.get('Icon', ''))[0]
            image_source = os.path.join(self.game_folder, image_name)

            if self.check_image('token'):
                self.save_image(image_source, image_path)

            token_info['chance'] = QuestSpecialItem.get('Chance', 0) / 100
            token_info['tasks'] = [task for task in QuestSpecialItem.get('PonyTasks', []) if task is not None]

            token_info['unlimited'] = bool(token.get('SaveSettings', {}).get('IsUnlimited', 0))
            token_info['no_reset'] = bool(token.get('SaveSettings', {}).get('DisableReset', 0))
            

    def get_items(self):
        self.categories.setdefault('item', {})
        items: dict = self.categories['item'].setdefault('objects', {})

        with self.get_game_file('prizetype.json', 'r') as file:
            prizetypes: dict[str, dict[str, dict[str, str]]] = json.load(file)
        
        os.makedirs(os.path.join(self.images_folder, 'game', 'item'), exist_ok = True)

        for id, config in prizetypes.get('PrizeData', {}).items():
            item = items.setdefault(id, {})
            item['name'] = translate(
                config['loc_string'],
                self.loc_files,
                item.get('name', {}),
            )

            item.setdefault('image', None)

            if config.get('image'):
                item['image'] = {}
                item['image']['main'] = normalize_path(os.path.join('game', 'item', f'{id}.png'))
                image_path = os.path.relpath(os.path.join(self.images_folder, item['image']['main']))
            
                image_name = os.path.splitext(config['image'])[0]
                image_source = os.path.join(self.game_folder, image_name)

                if not self.no_images:
                    self.save_image(image_source, image_path)
            
            item['alt_ids'] = prizetypes['PrizeStrings'].get(id, [])
    
    def get_group_quests(self):
        self.game_data.setdefault('group_quests', {})
        random_pros = self.game_data['group_quests']['random_pros'] = self.defaultGameCampaign.get('group_quests', {}).get('random_pros', [])
        quests: dict = self.game_data['group_quests'].setdefault('quests', {})

        group_quests: dict[str, dict] = json.load(self.get_game_file('groupquests.json'))

        console.print('getting group quests')

        for id, quest_data in group_quests.items():
            group_quest = {
               'name': translate(
                    quest_data['Name'],
                    self.loc_files,
                ),
                'description': translate(
                    quest_data['Description'],
                    self.loc_files,
                ),
                'pros': [],
            }

            for story_point in quest_data.get('StoryPoints', []):
                if not story_point.get('PremiumPony'):
                    continue

                pro = story_point['PremiumPony']
                self.categories['pony']['objects'][pro]['pro'] = id
                group_quest['pros'].append(pro)

            quests[id] = group_quest

        
        for pony in random_pros:
            self.categories['pony']['objects'][pony]['pro'] = 'random'

    def get_avatars(self):
        self.categories.setdefault('avatar', {})
        avatars: dict = self.categories['avatar'].setdefault('objects', {})

        
        os.makedirs(os.path.join(self.images_folder, 'game', 'avatar', 'main'), exist_ok = True)
        os.makedirs(os.path.join(self.images_folder, 'game', 'avatar', 'preview'), exist_ok = True)

        for index, avatar in track(
            enumerate(self.gameobjectdata['ProfileAvatar'].values()),
            description = 'Getting avatars...',
            total = len(self.gameobjectdata['ProfileAvatar']),
        ):
            avatar_info: dict = avatars.setdefault(avatar.id, {})

            avatar_info['index'] = index
            avatar_info.setdefault('locked', False)
            
            avatar_info['name'] = translate(
                avatar.get('Shop', {}).get('Label', avatar.id),
                self.loc_files,
                avatar_info.get('name', {}),
            )

            avatar_info['image'] = {}
            
            avatar_info['image']['preview'] = normalize_path(os.path.join('game', 'avatar', 'preview', f'{avatar.id}.png'))
            image_path = os.path.relpath(os.path.join(self.images_folder, avatar_info['image']['preview']))
        
            image_name = os.path.splitext(avatar.get('Shop', {}).get('Icon', ''))[0]
            image_source = os.path.join(self.game_folder, image_name)

            if self.check_image('avatar'):
                self.save_image(image_source, image_path)
            
            avatar_info['image']['main'] = normalize_path((os.path.join('game', 'avatar', 'main', f'{avatar.id}.png')))
            image_path = os.path.relpath(os.path.join(self.images_folder, avatar_info['image']['main']))
        
            image_name = os.path.splitext(avatar.get('Settings', {}).get('PictureActive', ''))[0]
            image_source = os.path.join(self.game_folder, image_name)

            if self.check_image('avatar'):
                self.save_image(image_source, image_path)
            
            avatar_info['is_default'] = avatar.get('Settings', {}).get('IsDefault', 0) == 1
            avatar_info['pony'] = avatar.get('Settings', {}).get('PonyStarsID', '')

def main():
    argparser = argparse.ArgumentParser()
    argparser.add_argument(
        '-v', '--version',
        help = 'Game version',
    )

    argparser.add_argument(
        '-g', '--game-folder',
        help = 'Game folder',
        required = True,
    )

    argparser.add_argument(
        '-o', '--output',
        help = 'Output folder',
        default = 'src/assets/game-data',
    )

    argparser.add_argument(
        '-a', '--assets',
        help = 'Assets output folder',
        default = 'public/images',
    )

    argparser.add_argument(
        '-ni', '--no-images',
        nargs = '*',
        # action = 'store_true',
        default = None,
        help = "Don't get images",
    )

    argparser.add_argument(
        '-w', '--wiki-status',
        help = 'Check wiki status',
        action = 'store_true',
    )

    args = argparser.parse_args()

    GetGameData(
        args.version,
        args.game_folder,
        args.output,
        args.assets,
        args.no_images,
        args.wiki_status,
    )

    return

if __name__ == "__main__":
    main()
