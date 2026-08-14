import os
import re
import unicodedata

def secure_filename(filename: str) -> str:
    r"""Pass it a filename and it will return a secure version of it.  This
    filename can then safely be stored on a regular file system and passed
    to :func:`os.path.join`.  The filename returned will be an ASCII only
    string for maximum portability.

    On windows systems the function also makes sure that the file is not
    named after one of the special device files.

    >>> secure_filename("My cool movie.mov")
    'My_cool_movie.mov'
    >>> secure_filename("../../../etc/passwd")
    'etc_passwd'
    >>> secure_filename('i contain \xfcmlauts.txt')
    'i_contain_umlauts.txt'

    :param filename: the filename to secure
    """
    if not isinstance(filename, str):
        filename = str(filename)

    # Normalize unicode characters to their ASCII equivalent
    filename = unicodedata.normalize("NFKD", filename)
    filename = filename.encode("ascii", "ignore").decode("ascii")

    for sep in os.sep, os.path.altsep:
        if sep:
            filename = filename.replace(sep, " ")

    # Keep only alphanumeric, dots, underscores and dashes
    filename = str(re.compile(r"[^A-Za-z0-9_.-]").sub("", "_".join(filename.split()))).strip("._")

    # On windows, some filenames are reserved
    if os.name == "nt":
        for name in (
            "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5",
            "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4",
            "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
        ):
            if filename.split(".")[0].upper() == name:
                filename = f"__reserved__{filename}"

    return filename
