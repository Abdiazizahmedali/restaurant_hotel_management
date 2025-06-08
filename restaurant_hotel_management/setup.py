from setuptools import setup, find_packages

with open("requirements.txt") as f:
    install_requires = f.read().strip().split("\n")

# get version from __version__ variable in restaurant_hotel_management/__init__.py
from restaurant_hotel_management import __version__ as version

setup(
    name="restaurant_hotel_management",
    version=version,
    description="Comprehensive Restaurant and Hotel Management System for ERPNext",
    author="Your Company",
    author_email="support@yourcompany.com",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires
)