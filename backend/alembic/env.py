import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, create_engine
from sqlalchemy import pool

from alembic import context

# Add parent dir to path so we can import our app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import Base
from config import get_settings

# Import all models so Base.metadata knows about them
import models  # noqa: F401

settings = get_settings()

# Alembic Config object
config = context.config

# Override sqlalchemy.url from our config (escape % for configparser)
config.set_main_option("sqlalchemy.url", settings.db_connection_url.replace("%", "%%"))

# Set up logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Use our models' metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(settings.db_connection_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
