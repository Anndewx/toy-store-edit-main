-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Nov 03, 2025 at 03:47 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `toy_store`
--
CREATE DATABASE IF NOT EXISTS `toy_store` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `toy_store`;

-- --------------------------------------------------------

--
-- Table structure for table `banners`
--

CREATE TABLE `banners` (
  `id` int(11) NOT NULL,
  `title` varchar(120) NOT NULL,
  `image_url` varchar(400) NOT NULL,
  `link_type` enum('category','product','url') DEFAULT 'category',
  `link_value` varchar(200) NOT NULL,
  `active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `starts_at` datetime DEFAULT NULL,
  `ends_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `banners`
--

INSERT INTO `banners` (`id`, `title`, `image_url`, `link_type`, `link_value`, `active`, `sort_order`, `starts_at`, `ends_at`, `created_at`) VALUES
(1, '10.10 ลดใหญ่ 30%', '/assets/banners/1010-main.jpg', 'url', 'https://your-campaign', 1, 10, NULL, NULL, '2025-10-10 14:56:45'),
(2, 'หมวดหุ่นยนต์ ลดพิเศษ', '/assets/banners/robot.jpg', 'category', 'gundam', 1, 20, NULL, NULL, '2025-10-10 14:56:45');

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `cart_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`cart_id`, `user_id`, `product_id`, `quantity`, `created_at`) VALUES
(141, 4, 3, 2, '2025-10-07 06:18:45'),
(142, 4, 7, 5, '2025-10-07 06:18:53'),
(155, 2, 3, 2, '2025-10-07 16:41:06');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `inventory_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`inventory_id`, `product_id`, `quantity`) VALUES
(1, 1, 0),
(2, 2, 29),
(3, 3, 8),
(4, 4, 82),
(5, 5, 41),
(6, 6, 7),
(7, 7, 108),
(8, 8, 90),
(9, 9, 6),
(10, 10, 100),
(11, 11, 75),
(12, 12, 0),
(16, 1, 0),
(40, 13, 9),
(41, 14, 0),
(42, 15, 17),
(43, 16, 95),
(44, 17, 98),
(45, 18, 75),
(46, 19, 5),
(47, 20, 99),
(48, 21, 98);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `payment_method` varchar(20) DEFAULT NULL,
  `status` enum('received','packing','shipping','delivered','cancelled') NOT NULL DEFAULT 'received',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`order_id`, `user_id`, `total_price`, `payment_method`, `status`, `created_at`) VALUES
(19, 3, 30.53, NULL, 'received', '2025-10-02 16:19:17'),
(20, 3, 76.75, NULL, 'received', '2025-10-02 16:41:29'),
(21, 3, 166.39, NULL, 'received', '2025-10-02 16:50:01'),
(29, 2, 30.53, NULL, 'received', '2025-10-07 15:28:55'),
(30, 2, 41.90, NULL, 'received', '2025-10-07 15:38:49'),
(31, 2, 49.90, NULL, 'received', '2025-10-07 15:49:18'),
(32, 2, 24.36, NULL, 'received', '2025-10-07 15:49:56'),
(33, 2, 44.00, NULL, 'received', '2025-10-07 16:06:49'),
(34, 2, 38.90, 'other', '', '2025-10-07 16:15:02'),
(39, 1, 369.45, 'bank', 'delivered', '2025-10-08 08:14:07'),
(42, 1, 681.98, 'bank', 'delivered', '2025-10-10 21:53:24'),
(44, 1, 356.44, 'other', 'delivered', '2025-10-11 14:01:36'),
(45, 1, 122.72, 'bank', 'delivered', '2025-10-11 15:07:50'),
(48, 1, 691.44, 'bank', 'shipping', '2025-10-13 04:05:26'),
(51, 1, 4720.61, 'bank', '', '2025-10-15 08:30:07'),
(52, 1, 430.53, 'bank', 'shipping', '2025-10-15 08:30:38');

-- --------------------------------------------------------

--
-- Table structure for table `order_details`
--

CREATE TABLE `order_details` (
  `detail_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_details`
--

INSERT INTO `order_details` (`detail_id`, `order_id`, `product_id`, `quantity`, `price`) VALUES
(26, 19, 6, 1, 30.53),
(27, 20, 9, 1, 46.22),
(28, 20, 6, 1, 30.53),
(29, 21, 3, 1, 53.96),
(30, 21, 19, 1, 29.90),
(31, 21, 14, 1, 52.00),
(32, 21, 6, 1, 30.53),
(50, 29, 6, 1, 30.53),
(51, 30, 20, 1, 41.90),
(52, 31, 17, 1, 49.90),
(53, 32, 8, 1, 24.36),
(54, 33, 15, 1, 44.00),
(55, 34, 21, 1, 38.90),
(70, 39, 3, 1, 53.96),
(71, 39, 6, 3, 30.53),
(72, 39, 19, 1, 29.90),
(73, 39, 13, 4, 48.50),
(79, 42, 3, 2, 53.96),
(80, 42, 19, 1, 29.90),
(81, 42, 15, 4, 44.00),
(82, 42, 1, 3, 61.36),
(83, 42, 1, 3, 61.36),
(86, 44, 16, 5, 57.00),
(87, 44, 15, 1, 44.00),
(88, 44, 10, 1, 27.44),
(89, 45, 1, 1, 61.36),
(90, 45, 1, 1, 61.36),
(96, 48, 3, 2, 153.96),
(97, 48, 4, 4, 39.78),
(98, 48, 19, 1, 129.90),
(99, 48, 18, 5, 18.90),
(109, 51, 6, 1, 430.53),
(110, 51, 9, 1, 1746.22),
(111, 51, 21, 1, 689.90),
(112, 51, 3, 1, 1853.96),
(113, 52, 6, 1, 430.53);

-- --------------------------------------------------------

--
-- Table structure for table `order_status_history`
--

CREATE TABLE `order_status_history` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `from_status` enum('received','packing','shipping','delivered','cancelled') DEFAULT NULL,
  `to_status` enum('received','packing','shipping','delivered','cancelled') NOT NULL,
  `changed_by` int(11) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_status_history`
--

INSERT INTO `order_status_history` (`id`, `order_id`, `from_status`, `to_status`, `changed_by`, `note`, `created_at`) VALUES
(1, 39, '', '', 1, NULL, '2025-10-08 12:49:52'),
(2, 39, '', 'shipping', 1, NULL, '2025-10-08 12:54:28'),
(3, 39, 'shipping', 'delivered', 1, NULL, '2025-10-08 12:54:36'),
(4, 42, '', '', 1, NULL, '2025-10-10 21:54:42'),
(5, 42, '', 'shipping', 1, NULL, '2025-10-10 21:54:48'),
(6, 45, '', '', 1, NULL, '2025-10-11 15:20:27'),
(7, 45, '', '', 1, NULL, '2025-10-11 15:20:54'),
(8, 45, '', 'shipping', 1, NULL, '2025-10-11 15:20:59'),
(9, 45, 'shipping', 'delivered', 1, NULL, '2025-10-11 15:21:10'),
(10, 48, '', '', 1, NULL, '2025-10-13 04:06:24'),
(11, 48, '', 'shipping', 1, NULL, '2025-10-13 04:07:15'),
(12, 44, '', '', 1, NULL, '2025-10-15 06:05:19'),
(13, 44, '', 'shipping', 1, NULL, '2025-10-15 06:05:27'),
(14, 44, 'shipping', 'delivered', 1, NULL, '2025-10-15 06:05:33'),
(15, 34, '', '', 1, NULL, '2025-10-15 06:41:39'),
(16, 42, 'shipping', 'delivered', 1, NULL, '2025-10-15 06:41:54'),
(17, 52, '', '', 1, NULL, '2025-10-15 08:38:01'),
(18, 52, '', 'shipping', 1, NULL, '2025-10-15 08:38:02');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `original_price` decimal(10,2) DEFAULT NULL,
  `on_sale` tinyint(1) DEFAULT 0,
  `image` varchar(255) DEFAULT NULL,
  `category_slug` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `category_id`, `name`, `description`, `price`, `stock`, `image_url`, `created_at`, `original_price`, `on_sale`, `image`, `category_slug`) VALUES
(1, NULL, 'MG 1/100 GUNDAM EXIA', NULL, 1361.36, 0, '/images/gundam.jpg', '2025-09-22 13:24:58', 1692.20, 1, 'images/gundam.jpg', 'gundam'),
(2, NULL, 'MSN-04 Sazabi', NULL, 270.61, 5, '/images/gundam1.jpg', '2025-09-22 13:24:58', 598.67, 1, 'images/gundam1.jpg', 'gundam'),
(3, NULL, 'Gundam Astray Red Frame', NULL, 1853.96, 2, '/images/gundam2.jpg', '2025-09-22 13:24:58', 2189.11, 1, 'images/gundam2.jpg', 'gundam'),
(4, NULL, 'Baby Groot', NULL, 439.78, 5, '/images/superhero.jpg', '2025-09-22 13:24:58', NULL, 0, 'images/superhero.jpg', 'superhero'),
(5, NULL, 'SuperHero Marvel Batman x Deadpool', NULL, 158.28, 10, '/images/superhero1.jpg', '2025-09-22 13:24:58', NULL, 0, 'images/superhero1.jpg', 'superhero'),
(6, NULL, 'Hero Stormtrooper', NULL, 430.53, 8, '/images/superhero2.jpg', '2025-09-22 13:24:58', 552.11, 1, 'images/superhero2.jpg', 'superhero'),
(7, NULL, 'Anime OnepieceYamato', NULL, 90.79, 10, '/images/anime.jpg', '2025-09-22 13:24:58', NULL, 0, 'images/anime.jpg', 'anime'),
(8, NULL, 'Anime Re:ZERORem', NULL, 64.36, 10, '/images/anime1.jpg', '2025-09-22 13:24:58', NULL, 0, 'images/anime1.jpg', 'anime'),
(9, NULL, 'Anime Evangelion Asuka Langley Soryu', NULL, 1746.22, 9, '/images/anime2.jpg', '2025-09-22 13:24:58', 2260.99, 1, 'images/anime2.jpg', 'anime'),
(10, NULL, 'Anime My Hero Academia Izuku Midoriya', NULL, 99.00, 10, '/images/anime3.jpg', '2025-09-22 13:24:58', NULL, 0, 'images/anime3.jpg', 'anime'),
(11, NULL, 'Game Halo', NULL, 120.00, 10, '/images/game.jpg', '2025-09-22 13:24:58', NULL, 0, 'images/game.jpg', 'game'),
(12, NULL, 'Game Super Mario', NULL, 59.00, 9, '/images/game1.jpg', '2025-09-22 13:24:58', 149.00, 1, 'images/game1.jpg', 'game'),
(13, NULL, 'SuperHero Marvel Wolverine', NULL, 890.50, 0, '/images/superhero3.jpg', '2025-09-28 12:52:59', 990.50, 1, 'images/superhero3.jpg', 'superhero'),
(14, NULL, 'SuperHero Marvel Deadpool', NULL, 999.00, 0, '/images/superhero4.jpg', '2025-09-28 12:52:59', 1000.00, 1, 'images/superhero4.jpg', 'superhero'),
(15, NULL, 'SuperHero Marvel Black Widow', NULL, 690.00, 0, '/images/superhero5.jpg', '2025-09-28 12:52:59', 790.99, 1, 'images/superhero5.jpg', 'superhero'),
(16, NULL, 'SuperHero Marvel Homelander', NULL, 27.00, 0, '/images/superhero6.jpg', '2025-09-28 12:52:59', NULL, 0, 'images/superhero6.jpg', 'superhero'),
(17, NULL, 'SuperHero Marvel The Hulk', NULL, 49.90, 0, '/images/superhero7.jpg', '2025-09-28 12:52:59', NULL, 0, 'images/superhero7.jpg', 'superhero'),
(18, NULL, 'Game Contra', NULL, 18.90, 0, '/images/game2.jpg', '2025-09-28 12:52:59', NULL, 0, 'images/game2.jpg', 'game'),
(19, NULL, 'Game DOOM', NULL, 2290.90, 0, '/images/game3.jpg', '2025-09-28 12:52:59', 3990.00, 1, 'images/game3.jpg', 'game'),
(20, NULL, 'Anime Dragonball Goku', NULL, 890.90, 0, '/images/anime4.jpg', '2025-09-28 12:52:59', NULL, 0, 'images/anime4.jpg', 'anime'),
(21, NULL, 'Anime Onepiece Luffy', NULL, 689.90, 0, '/images/anime5.jpg', '2025-09-28 12:52:59', NULL, 0, 'images/anime5.jpg', 'anime');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('customer','admin') NOT NULL DEFAULT 'customer',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'อัครพนธ์', 'd@gmail.com', '$2b$10$ae344CnyZTLceOmV9hgIUe93SAT03iC5gAnDe9zEqwjt8M2Iv1VIW', 'admin', '2025-09-22 14:59:15'),
(2, 'ศรัณย์กร', 'k@gmail.com', '$2b$10$jLS/pEtQQw3ybCa9FQiAXuwHCj5mtx19Z.jrDM/XMvZYFPnXE4PfG', 'customer', '2025-09-30 12:52:52'),
(3, 'test', 'test@gmail.com', '$2b$10$qgkz.zh5J6S7LtXIpljWeOgCnTaMTJiy3EIgyZ0dqBew/Byu9rpqO', 'customer', '2025-10-02 16:10:18'),
(4, 'uuu', 'ggg@gmail.com', '$2b$10$Brg7R9tFMFnF8yXyiZr3q.yP9pF8nvk9n6iKEjhKWq6BG2r2bLOkO', 'customer', '2025-10-07 06:15:46');

-- --------------------------------------------------------

--
-- Table structure for table `user_addresses`
--

CREATE TABLE `user_addresses` (
  `address_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `line1` varchar(200) NOT NULL,
  `line2` varchar(200) DEFAULT NULL,
  `subdistrict` varchar(120) NOT NULL,
  `district` varchar(120) NOT NULL,
  `province` varchar(120) NOT NULL,
  `postcode` varchar(10) NOT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_addresses`
--

INSERT INTO `user_addresses` (`address_id`, `user_id`, `full_name`, `phone`, `line1`, `line2`, `subdistrict`, `district`, `province`, `postcode`, `is_default`, `created_at`) VALUES
(2, 1, 'สรัณย์กร', '0999999', 'ayutthaya', '-', 'ธนู', 'อุทัย', 'อยุธยา', '13000', 0, '2025-10-10 19:57:40'),
(3, 1, 'อัครพนธ์', '0935786641', 'lopburi', '-', 'บ้านกล้วย', 'บ้านหมี่', 'ลพบุรี', '15110', 1, '2025-10-10 19:59:47');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`cart_id`),
  ADD UNIQUE KEY `uq_cart_user_product` (`user_id`,`product_id`),
  ADD KEY `idx_cart_user` (`user_id`),
  ADD KEY `idx_cart_product` (`product_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `uq_categories_name` (`category_name`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `idx_orders_user` (`user_id`),
  ADD KEY `idx_orders_status` (`status`),
  ADD KEY `idx_orders_created` (`created_at`);

--
-- Indexes for table `order_details`
--
ALTER TABLE `order_details`
  ADD PRIMARY KEY (`detail_id`),
  ADD KEY `idx_order_details_order` (`order_id`),
  ADD KEY `idx_order_details_product` (`product_id`);

--
-- Indexes for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `changed_by` (`changed_by`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_name` (`name`),
  ADD KEY `idx_products_created` (`created_at`);
ALTER TABLE `products` ADD FULLTEXT KEY `ft_products` (`name`,`description`,`category_slug`);
ALTER TABLE `products` ADD FULLTEXT KEY `name` (`name`,`category_slug`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_role` (`role`);

--
-- Indexes for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD PRIMARY KEY (`address_id`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `banners`
--
ALTER TABLE `banners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `cart_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=286;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `inventory_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=114;

--
-- AUTO_INCREMENT for table `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_addresses`
--
ALTER TABLE `user_addresses`
  MODIFY `address_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `order_details`
--
ALTER TABLE `order_details`
  ADD CONSTRAINT `fk_order_details_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_order_details_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON UPDATE CASCADE;

--
-- Constraints for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  ADD CONSTRAINT `order_status_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
