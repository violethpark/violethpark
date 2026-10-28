class NameRecord:
    nameID: int
    platformID: int
    platEncID: int
    langID: int
    def toUnicode(self, errors: str = ...) -> str: ...

class table__n_a_m_e:
    names: list[NameRecord]
    def setName(
        self, string: str, nameID: int, platformID: int, platEncID: int, langID: int
    ) -> None: ...
