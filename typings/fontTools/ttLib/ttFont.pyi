from typing import Literal

from fontTools.ttLib.tables._n_a_m_e import table__n_a_m_e

class TTFont:
    def __getitem__(self, tag: Literal["name"]) -> table__n_a_m_e: ...
